<template>
  <div class="device-page">
    <section class="page-header">
      <h1 class="page-title">设备管理</h1>
      <p class="page-desc">连接云端、绑定班级，确保教室端正常接收通知</p>
    </section>

    <section class="status-card" :class="statusClass">
      <div class="status-main">
        <span class="status-icon">{{ statusIcon }}</span>
        <div>
          <h2 class="status-title">{{ statusTitle }}</h2>
          <p class="status-sub">{{ statusText }}</p>
        </div>
      </div>
      <span class="status-badge">{{ statusBadge }}</span>
    </section>

    <!-- 未绑定：展示绑定码 -->
    <section v-if="!deviceStore.isBound" class="card">
      <h3 class="card-title">连接设备</h3>
      <p class="hint">请在小程序「绑定设备」中输入以下绑定码，并选择所属班级</p>
      <div class="bind-code">{{ deviceStore.bindCode || '获取中...' }}</div>
      <p v-if="deviceStore.bindCodeExpire" class="expire">有效期至 {{ formatTime(deviceStore.bindCodeExpire) }}</p>
      <button class="btn primary" :disabled="loading" @click="refreshCode">刷新绑定码</button>
    </section>

    <!-- 已绑定但离线：展示重新绑定码 -->
    <section v-if="deviceStore.isBound && !deviceStore.isOnline" class="card rebind-card">
      <h3 class="card-title">重新绑定</h3>
      <p class="hint">设备离线时，可在小程序输入新的绑定码恢复连接，无需删除设备</p>
      <div v-if="deviceStore.bindCode" class="bind-code">{{ deviceStore.bindCode }}</div>
      <p v-if="deviceStore.bindCodeExpire" class="expire">有效期至 {{ formatTime(deviceStore.bindCodeExpire) }}</p>
      <button class="btn primary" :disabled="loading" @click="requestRebind">获取重新绑定码</button>
    </section>

    <!-- 已绑定：设备信息 -->
    <section v-if="deviceStore.isBound" class="card">
      <h3 class="card-title">设备信息</h3>
      <div class="info-list">
        <div class="info-item">
          <span class="label">设备名称</span>
          <input v-model="localName" class="input" @blur="saveName" />
        </div>
        <div class="info-item">
          <span class="label">所属班级</span>
          <span class="value">{{ deviceStore.deptName || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">设备 ID</span>
          <span class="value mono">{{ deviceStore.deviceId }}</span>
        </div>
        <div class="info-item">
          <span class="label">连接状态</span>
          <span class="value" :class="statusClass">{{ statusText }}</span>
        </div>
        <div class="info-item">
          <span class="label">最后同步</span>
          <span class="value">{{ deviceStore.lastSyncTime || '—' }}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn secondary" @click="reconnect">重新连接</button>
        <button class="btn danger" @click="resetBind">重新绑定</button>
      </div>
    </section>

    <section class="card tip-card">
      <p class="tip">绑定成功后，小程序向该班级发送喊话，本设备将自动语音播报并可选弹窗通知。</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useToast } from '@composables/useToast'

const deviceStore = useDeviceStore()
const toast = useToast()
const loading = ref(false)
const localName = ref(deviceStore.deviceName)

const statusClass = computed(() => {
  if (!deviceStore.isBound) return 'waiting'
  const map = { online: 'online', connecting: 'connecting', reconnecting: 'connecting', offline: 'offline' }
  return map[deviceStore.connectionStatus] || 'offline'
})

const statusTitle = computed(() => {
  if (!deviceStore.isBound) return '等待绑定'
  const map = { online: '运行正常', connecting: '连接中', reconnecting: '重连中', offline: '连接断开' }
  return map[deviceStore.connectionStatus] || '离线'
})

const statusText = computed(() => {
  if (!deviceStore.isBound) return '请使用绑定码完成设备连接'
  const map = {
    online: '已连接云端，等待课堂通知',
    connecting: '正在连接云端...',
    reconnecting: '网络波动，正在重连...',
    offline: '当前离线，请检查网络或重新连接',
  }
  return map[deviceStore.connectionStatus] || '离线'
})

const statusBadge = computed(() => {
  if (!deviceStore.isBound) return '待连接'
  return deviceStore.isOnline ? '一切正常' : '需要关注'
})

const statusIcon = computed(() => {
  if (!deviceStore.isBound) return '🔗'
  return deviceStore.isOnline ? '✓' : '!'
})

async function refreshCode() {
  loading.value = true
  try {
    await deviceStore.requestBindCode()
    toast.success('绑定码已刷新')
  } catch (error) {
    toast.error(error.message || '获取绑定码失败')
  } finally {
    loading.value = false
  }
}

function saveName() {
  deviceStore.setDeviceName(localName.value)
}

async function reconnect() {
  try {
    await deviceStore.reconnect()
    toast.success('正在重新连接')
  } catch (error) {
    toast.error(error.message || '重连失败')
  }
}

async function requestRebind() {
  loading.value = true
  try {
    await deviceStore.requestRebindCode()
    toast.success('请在小程序输入新的绑定码')
  } catch (error) {
    toast.error(error.message || '获取绑定码失败')
  } finally {
    loading.value = false
  }
}

async function resetBind() {
  if (!confirm('确定完全重置绑定吗？将生成新的设备 ID，原设备记录需从小程序删除。')) return
  loading.value = true
  try {
    await deviceStore.resetBinding()
    toast.success('请使用新绑定码绑定')
  } catch (error) {
    toast.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

function formatTime(time) {
  if (!time) return ''
  return String(time).replace('T', ' ').substring(0, 16)
}
</script>

<style scoped>
.device-page {
  max-width: 760px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #eff6ff, #ecfdf5);
}

.status-card.online {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
}

.status-card.waiting,
.status-card.offline {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.status-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #059669;
  box-shadow: 0 4px 12px rgba(15, 35, 52, 0.08);
}

.status-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.status-sub {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  white-space: nowrap;
}

.card {
  margin-bottom: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
}

.card-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
}

.hint {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 14px;
}

.bind-code {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 8px;
  text-align: center;
  color: #07c160;
  padding: 16px 0;
}

.expire {
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  width: 88px;
  flex-shrink: 0;
  font-size: 14px;
  color: #6b7280;
}

.value {
  font-size: 14px;
  color: #111827;
}

.value.mono {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #07c160;
  color: #fff;
}

.btn.secondary {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn.danger {
  background: #ef4444;
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}
</style>
