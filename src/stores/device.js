/**
 * 设备端状态：绑定、连接、指令
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createBindCode, getBindStatus, getBindStatusByCode, getRecentCommands } from '@/api/broadcast'
import { configureAgent, stopAgent, onAgentConnectionStatus } from '@/services/agentBridge'
import { logger } from '@/utils/logger'
import { buildNotifyTitle, mapCommandStatus } from '@/utils/broadcast'

/** 避免重复注册连接状态监听 */
let connectionListenerRegistered = false

function createDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`
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
    const connectionStatus = ref('offline') // offline | connecting | online | reconnecting
    const lastCommand = ref(null)
    const pollTimer = ref(null)
    /** 最近动态列表 */
    const activities = ref([])
    /** 今日统计 */
    const stats = ref({ notificationCount: 0, ttsCount: 0 })
    /** 最后同步时间 */
    const lastSyncTime = ref('')
    /** 本次启动时间，用于计算在线时长 */
    const sessionStartAt = ref(Date.now())

    const isBound = computed(() => !!deviceToken.value)
    const isOnline = computed(() => connectionStatus.value === 'online')

    function ensureDeviceId() {
      if (!deviceId.value) {
        deviceId.value = createDeviceId()
      }
      return deviceId.value
    }

    async function requestBindCode() {
      const id = ensureDeviceId()
      const result = await createBindCode(id, deviceName.value)
      // 已绑定且在线：直接恢复连接，不重复发码
      if (result?.alreadyBound) {
        bindCode.value = ''
        stopBindPolling()
        await checkBindStatus()
        return result
      }
      bindCode.value = result.bindCode
      bindCodeExpire.value = result.expireTime
      startBindPolling()
      return result
    }

    /** 离线设备申请重新绑定码，保留 deviceId，供小程序刷新 Token */
    async function requestRebindCode() {
      const id = ensureDeviceId()
      if (!deviceToken.value) {
        return requestBindCode()
      }
      stopBindPolling()
      const result = await createBindCode(id, deviceName.value)
      if (result?.alreadyBound) {
        bindCode.value = ''
        await checkBindStatus()
        return result
      }
      bindCode.value = result.bindCode
      bindCodeExpire.value = result.expireTime
      startBindPolling()
      return result
    }

    function stopBindPolling() {
      if (pollTimer.value) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
      }
    }

    function startBindPolling() {
      stopBindPolling()
      pollTimer.value = setInterval(async () => {
        try {
          await checkBindStatus()
        } catch (error) {
          logger.warn('轮询绑定状态失败:', error)
        }
      }, 3000)
    }

    async function checkBindStatus() {
      const waitingCode = bindCode.value
      const status = waitingCode ? await getBindStatusByCode(waitingCode) : await getBindStatus(ensureDeviceId())

      if (!status?.bound || !status.deviceToken) {
        return status
      }

      const previousToken = deviceToken.value
      const tokenChanged = !!previousToken && previousToken !== status.deviceToken
      const firstBind = !previousToken

      // 同步服务端真实 deviceId（重新绑定后可能与本地不同）
      if (status.deviceId) {
        deviceId.value = status.deviceId
      }
      deviceToken.value = status.deviceToken
      deptName.value = status.deptName || ''
      if (status.deviceName) {
        deviceName.value = status.deviceName
      }

      // 正在等待小程序输入绑码：Token 未刷新前继续轮询
      if (waitingCode && !firstBind && !tokenChanged) {
        return status
      }

      bindCode.value = ''
      stopBindPolling()

      if (tokenChanged) {
        await stopAgent()
      }
      await connectWs()
      lastSyncTime.value = formatDateTime(new Date())
      if (firstBind || tokenChanged) {
        addActivity(
          tokenChanged ? '设备重新绑定成功' : '设备绑定成功',
          `${deptName.value || deviceName.value} 已连接`,
          '运行正常'
        )
      }
      await syncActivities()
      logger.info(tokenChanged ? '设备重新绑定成功' : '设备绑定成功')
      return status
    }

    function formatDateTime(date) {
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function formatActivityTime(date) {
      const now = new Date()
      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      const pad = n => String(n).padStart(2, '0')
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
      if (isToday) return time
      return `昨天 ${time}`
    }

    function formatActivityTimeFromSendTime(sendTime) {
      if (!sendTime) return formatActivityTime(new Date())
      const normalized = String(sendTime).includes('T') ? sendTime : String(sendTime).replace(' ', 'T')
      const date = new Date(normalized)
      if (Number.isNaN(date.getTime())) return formatActivityTime(new Date())
      return formatActivityTime(date)
    }

    /** 从服务端同步指令历史（含发送人） */
    async function syncActivities() {
      if (!deviceId.value || !deviceToken.value) return

      try {
        const list = await getRecentCommands(deviceId.value, deviceToken.value, 20)
        const systemItems = activities.value.filter(item => item.kind === 'system')
        const commandItems = (list || []).map(cmd => {
          const senderName = cmd.senderName || ''
          return {
            id: cmd.requestId || `${cmd.sendTime}-${cmd.text}`,
            requestId: cmd.requestId,
            kind: 'command',
            time: formatActivityTimeFromSendTime(cmd.sendTime),
            title: buildNotifyTitle(senderName, '课堂通知'),
            content: cmd.text || '—',
            status: mapCommandStatus(cmd.status),
            senderName,
          }
        })

        activities.value = [...systemItems, ...commandItems].slice(0, 50)

        if (commandItems.length > 0) {
          const latest = commandItems[0]
          lastCommand.value = {
            type: 'TTS',
            text: latest.content,
            senderName: latest.senderName,
            time: latest.time,
          }
        }
      } catch (error) {
        logger.warn('同步指令历史失败:', error)
      }
    }

    /** 追加一条系统动态（绑定、启动等） */
    function addActivity(title, content, status = '执行成功', senderName = '') {
      activities.value.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        kind: 'system',
        time: formatActivityTime(new Date()),
        title,
        content,
        status,
        senderName: senderName || '',
      })
      if (activities.value.length > 50) {
        activities.value.length = 50
      }
    }

    async function connectWs() {
      if (!deviceToken.value) return
      await configureAgent({
        deviceId: deviceId.value,
        deviceToken: deviceToken.value,
        deviceName: deviceName.value,
      })
    }

    /** 重新连接：先停后启，避免僵尸连接 */
    async function reconnect() {
      if (!deviceToken.value) {
        throw new Error('设备未绑定')
      }
      try {
        const status = await getBindStatus(deviceId.value)
        if (status?.bound && status.deviceToken) {
          deviceToken.value = status.deviceToken
          if (status.deviceName) deviceName.value = status.deviceName
          if (status.deptName) deptName.value = status.deptName
        } else {
          deviceToken.value = ''
          throw new Error('设备已在服务端解绑，请重新绑定')
        }
      } catch (error) {
        if (deviceToken.value) {
          logger.warn('同步绑定状态失败，尝试使用本地 Token 重连:', error)
        } else {
          throw error
        }
      }
      await stopAgent()
      await connectWs()
    }

    async function disconnectWs() {
      await stopAgent()
      connectionStatus.value = 'offline'
    }

    /** 解绑并重新获取绑定码（生成新 deviceId，避免与已绑定记录冲突） */
    async function resetBinding() {
      disconnectWs()
      deviceToken.value = ''
      deptName.value = ''
      bindCode.value = ''
      deviceId.value = createDeviceId()
      await requestBindCode()
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

      ensureDeviceId()
      sessionStartAt.value = Date.now()

      try {
        const status = await getBindStatus(deviceId.value)
        if (status?.bound && status.deviceToken) {
          deviceToken.value = status.deviceToken
          deptName.value = status.deptName || ''
          if (status.deviceName) {
            deviceName.value = status.deviceName
          }
          await connectWs()
          await syncActivities()
          return
        }
      } catch (error) {
        logger.warn('校验绑定状态失败:', error)
        // 网络抖动时保留本地 Token 尝试重连，避免误申请绑定码
        if (deviceToken.value) {
          await connectWs()
          return
        }
      }

      if (!deviceToken.value) {
        await requestBindCode()
      }
    }

    function setDeviceName(name) {
      deviceName.value = name || '教室设备'
    }

    async function recordCommand(envelope) {
      lastSyncTime.value = formatDateTime(new Date())

      // 弹窗指令随 TTS 一起下发，动态里不重复记录
      if (envelope.type === 'SHOW_MESSAGE') {
        return
      }

      stats.value.notificationCount += 1
      if (envelope.type === 'TTS') {
        stats.value.ttsCount += 1
      }

      // 从服务端拉取历史，确保展示发送人昵称
      await syncActivities()
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
      paths: ['deviceId', 'deviceToken', 'deviceName', 'deptName', 'stats', 'activities'],
    },
  }
)
