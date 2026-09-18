/**
 * 设备绑定与连接状态
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createBindCode, getBindStatus, getBindStatusByCode, getRecentCommands } from '@/api/broadcast'
import { configureAgent, getAgentConfig, onAgentConnectionStatus, stopAgent } from '@/services/agentBridge'
import { logger } from '@/utils/logger'
import { buildNotifyTitle, mapCommandStatus } from '@/utils/broadcast'

let connectionListenerRegistered = false

function createDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useDeviceStore = defineStore(
  'device',
  () => {
    const deviceId = ref('')
    const deviceToken = ref('')
    const deviceName = ref('教室设备')
    const deptName = ref('')
    const bindCode = ref('')
    const bindCodeExpire = ref('')
    const bound = ref(false)
    const connectionStatus = ref('offline')
    const lastCommand = ref(null)
    const pollTimer = ref(null)
    const activities = ref([])
    const stats = ref({ notificationCount: 0, ttsCount: 0 })
    const lastSyncTime = ref('')
    const sessionStartAt = ref(Date.now())

    const isBound = computed(() => bound.value)
    const isOnline = computed(() => connectionStatus.value === 'online')

    function formatDateTime(date) {
      const pad = value => String(value).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function formatActivityTime(date) {
      const now = new Date()
      const pad = value => String(value).padStart(2, '0')
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
      return now.toDateString() === date.toDateString() ? time : `昨天 ${time}`
    }

    function ensureDeviceId() {
      if (!deviceId.value) {
        deviceId.value = createDeviceId()
      }
      return deviceId.value
    }

    function stopBindPolling() {
      if (pollTimer.value) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
      }
    }

    function startBindPolling() {
      stopBindPolling()
      pollTimer.value = setInterval(() => {
        checkBindStatus().catch(error => logger.warn('轮询绑定状态失败:', error))
      }, 3000)
    }

    async function requestBindCode() {
      const result = await createBindCode(ensureDeviceId(), deviceName.value)
      if (result.alreadyBound) {
        throw new Error('设备已绑定且在线，无需重复申请绑定码')
      }
      deviceId.value = result.deviceId || deviceId.value
      bindCode.value = result.bindCode || ''
      bindCodeExpire.value = result.expireTime || ''
      bound.value = false
      deviceToken.value = ''
      startBindPolling()
      return result
    }

    async function requestRebindCode() {
      await stopAgent()
      bound.value = false
      deviceToken.value = ''
      return requestBindCode()
    }

    async function checkBindStatus() {
      const status = bindCode.value
        ? await getBindStatusByCode(bindCode.value)
        : await getBindStatus(deviceId.value)

      // 服务端 bound=true 但未返回 Token 时继续轮询，避免卡死在「已绑定但离线」
      if (!status?.bound || !status.deviceToken) {
        return status
      }

      deviceToken.value = status.deviceToken
      deviceId.value = status.deviceId || deviceId.value
      deviceName.value = status.deviceName || deviceName.value
      deptName.value = status.deptName || ''
      bound.value = true
      stopBindPolling()
      bindCode.value = ''
      await connectWs()
      lastSyncTime.value = formatDateTime(new Date())
      addActivity('设备绑定成功', `${deviceName.value} 已连接`, '运行正常')
      await syncActivities()
      return status
    }

    async function syncActivities() {
      if (!bound.value || !deviceToken.value) return
      try {
        const list = await getRecentCommands(deviceId.value, deviceToken.value, 20)
        const systemItems = activities.value.filter(item => item.kind === 'system')
        const commandItems = (list || []).map(command => {
          const date = command.sendTime ? new Date(String(command.sendTime).replace(' ', 'T')) : new Date()
          return {
            id: command.requestId || `${command.sendTime}-${command.text}`,
            requestId: command.requestId,
            kind: 'command',
            time: Number.isNaN(date.getTime()) ? formatActivityTime(new Date()) : formatActivityTime(date),
            title: buildNotifyTitle(command.senderName || '', '课堂通知'),
            content: command.text || '—',
            status: mapCommandStatus(command.status),
            senderName: command.senderName || '',
          }
        })
        activities.value = [...systemItems, ...commandItems].slice(0, 50)
        if (commandItems[0]) {
          lastCommand.value = {
            type: 'TTS',
            text: commandItems[0].content,
            senderName: commandItems[0].senderName,
            time: commandItems[0].time,
          }
        }
      } catch (error) {
        logger.warn('同步指令历史失败:', error)
      }
    }

    function addActivity(title, content, status = '执行成功', senderName = '') {
      activities.value.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        kind: 'system',
        time: formatActivityTime(new Date()),
        title,
        content,
        status,
        senderName,
      })
      activities.value = activities.value.slice(0, 50)
    }

    async function connectWs() {
      if (!bound.value || !deviceToken.value) return
      await configureAgent({
        deviceId: deviceId.value,
        deviceToken: deviceToken.value,
        deviceName: deviceName.value,
      })
    }

    async function reconnect() {
      if (!bound.value || !deviceToken.value) throw new Error('设备未绑定')
      await stopAgent()
      await connectWs()
    }

    async function disconnectWs() {
      await stopAgent()
      connectionStatus.value = 'offline'
    }

    async function resetBinding() {
      await stopAgent()
      deviceToken.value = ''
      bound.value = false
      bindCode.value = ''
      deptName.value = ''
      await configureAgent({
        deviceId: deviceId.value,
        deviceToken: '',
        deviceName: deviceName.value,
      })
      await requestBindCode()
    }

    function setDeviceName(name) {
      deviceName.value = name || '教室设备'
    }

    async function recordCommand(envelope) {
      lastSyncTime.value = formatDateTime(new Date())
      if (envelope.type === 'TTS') stats.value.ttsCount += 1
      if (envelope.type !== 'SHOW_MESSAGE') stats.value.notificationCount += 1
      await syncActivities()
    }

    /** 应用 Rust 侧已持久化的绑定凭据（config.json） */
    async function syncFromRustConfig() {
      try {
        const config = await getAgentConfig()
        if (!config?.deviceToken) return false
        deviceId.value = config.deviceId || deviceId.value
        deviceToken.value = config.deviceToken
        deviceName.value = config.deviceName || deviceName.value
        bound.value = true
        return true
      } catch (error) {
        logger.warn('读取 Rust 绑定配置失败:', error)
        return false
      }
    }

    /** 通过 deviceId 向后端恢复 Token（localStorage 丢失时兜底） */
    async function recoverBindingFromServer() {
      if (!deviceId.value) return false
      try {
        const status = await getBindStatus(deviceId.value)
        if (!status?.bound || !status.deviceToken) return false
        deviceToken.value = status.deviceToken
        deviceId.value = status.deviceId || deviceId.value
        deviceName.value = status.deviceName || deviceName.value
        deptName.value = status.deptName || ''
        bound.value = true
        return true
      } catch (error) {
        logger.warn('从服务端恢复绑定失败:', error)
        return false
      }
    }

    async function bootstrap() {
      if (!connectionListenerRegistered) {
        connectionListenerRegistered = true
        onAgentConnectionStatus(status => {
          connectionStatus.value = status
          if (status === 'online') {
            lastSyncTime.value = formatDateTime(new Date())
            syncActivities()
          }
        })
      }

      sessionStartAt.value = Date.now()

      // 有 Token 即视为已绑定（bound 以前未持久化，重启后可能为 false）
      if (deviceToken.value) {
        bound.value = true
        await connectWs()
        await syncActivities()
        return
      }

      if (await syncFromRustConfig()) {
        await connectWs()
        await syncActivities()
        return
      }

      if (await recoverBindingFromServer()) {
        await connectWs()
        await syncActivities()
        return
      }

      await requestBindCode()
    }

    return {
      deviceId,
      deviceToken,
      deviceName,
      deptName,
      bindCode,
      bindCodeExpire,
      connectionStatus,
      lastCommand,
      activities,
      stats,
      lastSyncTime,
      sessionStartAt,
      isBound,
      isOnline,
      addActivity,
      syncActivities,
      bootstrap,
      requestBindCode,
      requestRebindCode,
      checkBindStatus,
      connectWs,
      reconnect,
      disconnectWs,
      resetBinding,
      setDeviceName,
      recordCommand,
      stopBindPolling,
    }
  },
  {
    persist: {
      key: 'broadcast-device',
      storage: localStorage,
      paths: ['deviceId', 'deviceToken', 'deviceName', 'deptName', 'bound', 'stats', 'activities'],
    },
  }
)
