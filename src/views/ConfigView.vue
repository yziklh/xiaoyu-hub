<template>
  <div class="config-tab-container">
    <div class="header-section">
      <h2><icon-proicons-settings /> 应用设置</h2>
      <p class="description">管理应用的各项配置和偏好设置</p>
    </div>

    <!-- 配置分类 -->
    <div class="config-sections">
      <!-- 喊话服务 -->
      <div class="config-section">
        <h3>📡 喊话服务</h3>
        <div class="config-items">
          <div class="config-item">
            <label class="config-label">后端地址:</label>
            <input v-model="apiBase" class="config-input" :placeholder="DEFAULT_API_BASE" />
          </div>
          <div class="config-item">
            <label class="config-label">操作:</label>
            <button class="btn btn-primary" @click="saveApiBase">保存并重连</button>
          </div>
          <div class="config-item">
            <label class="config-label">开机自启:</label>
            <label class="switch-wrap">
              <input v-model="autoStart" type="checkbox" @change="saveAutoStart" />
              <span>{{ autoStart ? '已开启' : '已关闭' }}</span>
            </label>
          </div>
          <div class="config-item">
            <label class="config-label">语音测试:</label>
            <button class="btn btn-secondary" @click="testVoice">测试 Rust TTS</button>
          </div>
        </div>
      </div>

      <!-- 数据存储 -->
      <div class="config-section">
        <h3>💾 数据存储</h3>
        <div class="config-items">
          <div class="config-item">
            <label class="config-label">数据目录:</label>
            <span class="info-text">{{ appDataDir }}</span>
          </div>
          <div class="config-item">
            <label class="config-label">配置文件:</label>
            <span class="info-text">config.json</span>
          </div>
          <div class="config-item">
            <label class="config-label">操作:</label>
            <div class="database-actions">
              <button class="btn btn-danger" :disabled="isClearing" @click="clearLocalStorage">
                <icon-proicons-spinner v-if="isClearing" class="spinning" />
                <icon-proicons-delete v-else />
                {{ isClearing ? '清空中...' : '清空 LocalStorage' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="config-section">
        <h3><icon-proicons-info /> 系统信息</h3>
        <div class="config-items">
          <div class="config-item">
            <label class="config-label">应用版本:</label>
            <span class="info-text">v{{ appVersion }}</span>
          </div>
          <div class="config-item">
            <label class="config-label">操作系统:</label>
            <span class="info-text">{{ systemInfo.os }} ({{ systemInfo.arch }})</span>
          </div>
          <div class="config-item">
            <label class="config-label">系统版本:</label>
            <span class="info-text">{{ systemInfo.os_version }}</span>
          </div>
          <div class="config-item">
            <label class="config-label">数据目录:</label>
            <span class="info-text">{{ appDataDir }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ref, onMounted, computed 已通过 unplugin-auto-import 自动导入
// useAppStore, useSettingsStore 已通过 unplugin-auto-import 自动导入
import { useToast } from '@composables/useToast'
import { DEFAULT_API_BASE, getApiBase, setApiBase } from '@/config/api'
import { useDeviceStore } from '@/stores/device'
import { isAgentAutostartEnabled, setAgentAutostart, testAgentTts } from '@/services/agentBridge'

// 使用 Stores 和 Composables
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const toast = useToast()
const deviceStore = useDeviceStore()

// 响应式数据
const isClearing = ref(false)
const apiBase = ref(getApiBase())
const autoStart = ref(true)

// 从 Store 获取数据
const appVersion = computed(() => appStore.version || '1.0.0')
const appDataDir = computed(() => appStore.dataDir || '加载中...')
const systemInfo = computed(
  () =>
    appStore.systemInfo || {
      os: '加载中...',
      arch: '',
      os_version: '',
    }
)
const saveAutoStart = async () => {
  try {
    await setAgentAutostart(autoStart.value)
    toast.success(autoStart.value ? '已开启开机自启' : '已关闭开机自启')
  } catch (error) {
    toast.error(error.message || '设置开机自启失败')
  }
}

const testVoice = async () => {
  try {
    // 异步播报，不等待播放结束
    testAgentTts('教室小助手语音测试')
    toast.success('已开始测试播报')
  } catch (error) {
    toast.error(error.message || '测试播报失败')
  }
}

const saveApiBase = async () => {
  if (!apiBase.value.trim()) {
    toast.error('请输入后端地址')
    return
  }
  setApiBase(apiBase.value.trim())
  toast.success('后端地址已保存')
  try {
    await deviceStore.bootstrap()
  } catch (error) {
    toast.error(error.message || '重连失败')
  }
}

// 清空 LocalStorage
const clearLocalStorage = async () => {
  const confirmed = confirm('⚠️ 确定要清空 LocalStorage 吗？\n\n此操作不可撤销！')

  if (!confirmed) {
    return
  }

  isClearing.value = true

  try {
    localStorage.clear()
    toast.success('LocalStorage 已清空')

    // 重置设置为默认值
    settingsStore.resetSettings()
  } catch (error) {
    toast.error(`清空失败: ${error.message}`)
  } finally {
    isClearing.value = false
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  // 如果 appStore 还没有初始化，手动初始化
  if (!appStore.version) {
    try {
      await appStore.initialize()
    } catch {
      toast.error('加载应用信息失败')
    }
  }
  try {
    autoStart.value = await isAgentAutostartEnabled()
  } catch (error) {
    console.warn('读取开机自启状态失败:', error)
  }
})
</script>

<style scoped>
.config-tab-container {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.header-section {
  margin-bottom: var(--spacing-lg);
}

.description {
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.config-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
}

.config-section h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing);
  font-size: var(--font-size);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

.config-item {
  display: flex;
  align-items: center;
  gap: var(--spacing);
  padding: var(--spacing);
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.config-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 100px;
  flex-shrink: 0;
}

.info-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-family: monospace;
  word-break: break-all;
}

.config-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
}

.btn-primary {
  background: var(--primary-color);
  color: #fff;
}

/* 数据库操作 */
.database-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
