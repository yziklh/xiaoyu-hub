<template>
  <footer class="main-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="status-dot" :class="statusClass"></span>
        <span class="status-text">{{ footerStatus }}</span>
      </div>
      <div class="footer-right">
        <span class="version">版本 v{{ appVersion }}</span>
        <button class="link-btn" :disabled="updating" @click="handleCheckUpdate()">
          {{ updating ? updateStatusText : '检查更新' }}
        </button>
      </div>
    </div>

    <div v-if="updateDialogVisible" class="update-overlay">
      <div class="update-dialog">
        <h3>{{ forceUpdate ? '必须更新' : '发现新版本' }}</h3>
        <p class="update-version">v{{ pendingUpdate?.version }}</p>
        <p v-if="pendingUpdate?.releaseNotes" class="update-notes">{{ pendingUpdate.releaseNotes }}</p>
        <p v-if="updating" class="update-progress">{{ updateStatusText }}</p>
        <div class="update-actions">
          <button v-if="!forceUpdate && !updating" class="btn-secondary" @click="updateDialogVisible = false">
            稍后
          </button>
          <button class="btn-primary" :disabled="updating" @click="handleInstallUpdate">
            {{ updating ? '更新中...' : '立即更新' }}
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDeviceStore } from '@/stores/device'
import { useToast } from '@composables/useToast'
import { checkForUpdate, downloadAndInstall, getAppVersion, onUpdateProgress, onUpdateStatus } from '@/services/updater'

const deviceStore = useDeviceStore()
const toast = useToast()

const appVersion = ref('...')
const updating = ref(false)
const updateDialogVisible = ref(false)
const pendingUpdate = ref(null)
const forceUpdate = ref(false)
const updateStatusText = ref('检查中...')
const downloadProgress = ref('')

let unlistenProgress = null
let unlistenStatus = null

const statusClass = computed(() => {
  if (!deviceStore.isBound) return 'waiting'
  return deviceStore.isOnline ? 'online' : 'offline'
})

const footerStatus = computed(() => {
  if (!deviceStore.isBound) return '未连接设备 | 等待绑定'
  if (deviceStore.isOnline) return '已连接云端 | 运行正常'
  if (deviceStore.connectionStatus === 'connecting' || deviceStore.connectionStatus === 'reconnecting') {
    return '连接中 | 请稍候'
  }
  return '云端未连接 | 请检查网络'
})

/** @param {boolean} [silent=false] 静默检查（仅启动时），不弹 toast */
async function handleCheckUpdate(silent = false) {
  const quiet = silent === true
  try {
    updating.value = true
    updateStatusText.value = '检查中...'
    const result = await checkForUpdate()
    if (result?.hasUpdate) {
      pendingUpdate.value = result
      forceUpdate.value = !!result.forceUpdate
      updateDialogVisible.value = true
      if (!quiet) {
        toast.success(`发现新版本 ${result.version}`)
      }
    } else if (!quiet) {
      toast.success('当前已是最新版本')
    }
  } catch (error) {
    const message = error?.message || String(error || '检查更新失败')
    if (!quiet) {
      toast.error(message)
    }
  } finally {
    updating.value = false
    updateStatusText.value = '检查更新'
  }
}

async function handleInstallUpdate() {
  if (!pendingUpdate.value?.downloadUrl) {
    toast.error('缺少下载地址，请联系管理员')
    return
  }
  try {
    updating.value = true
    updateStatusText.value = '正在下载...'
    await downloadAndInstall(pendingUpdate.value.downloadUrl)
  } catch (error) {
    updating.value = false
    updateStatusText.value = '检查更新'
    toast.error(error.message || error || '更新失败')
  }
}

onMounted(async () => {
  try {
    appVersion.value = await getAppVersion()
  } catch {
    appVersion.value = '1.0.1'
  }

  unlistenProgress = await onUpdateProgress(payload => {
    const { downloaded, total } = payload || {}
    if (total) {
      const percent = Math.min(100, Math.round((downloaded / total) * 100))
      downloadProgress.value = `${percent}%`
      updateStatusText.value = `下载中 ${percent}%`
    }
  })

  unlistenStatus = await onUpdateStatus(status => {
    if (status === 'downloading') {
      updateStatusText.value = '正在下载...'
    } else if (status === 'installing') {
      updateStatusText.value = '正在安装...'
    } else if (status === 'restarting') {
      updateStatusText.value = '即将重启...'
    }
  })

  // 启动时静默检查，强制更新时弹窗
  handleCheckUpdate(true)
})

onUnmounted(() => {
  unlistenProgress?.()
  unlistenStatus?.()
})
</script>

<style scoped>
.main-footer {
  background: #fff;
  border-top: 1px solid #e8eef3;
  padding: 10px 16px;
  flex-shrink: 0;
  position: relative;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.status-dot.waiting {
  background: #f59e0b;
}

.status-dot.offline {
  background: #ef4444;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version {
  color: #9ca3af;
}

.link-btn {
  border: none;
  background: none;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover:not(:disabled) {
  text-decoration: underline;
}

.link-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.update-dialog {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
}

.update-dialog h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #111827;
}

.update-version {
  margin: 0 0 12px;
  color: #2563eb;
  font-weight: 600;
}

.update-notes {
  margin: 0 0 12px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.update-progress {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 12px;
}

.update-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}
</style>
