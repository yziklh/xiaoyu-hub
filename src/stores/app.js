// defineStore 已通过 unplugin-auto-import 自动导入
// ref, computed 已通过 unplugin-auto-import 自动导入
import { api } from '@api'
import { logger } from '@/utils/logger'

/**
 * 应用全局 Store
 * 管理应用级别的状态，如版本信息、数据目录等
 * 使用 pinia-plugin-persistedstate 自动持久化到 localStorage
 */
export const useAppStore = defineStore(
  'app',
  () => {
    // ==================== State ====================
    const version = ref('')
    const dataDir = ref('')
    const systemInfo = ref(null)
    const isInitialized = ref(false)
    const isLoading = ref(false)
    const error = ref(null)

    // ==================== Getters ====================
    const appInfo = computed(() => ({
      version: version.value,
      dataDir: dataDir.value,
      systemInfo: systemInfo.value,
      isInitialized: isInitialized.value,
    }))

    const hasError = computed(() => error.value !== null)

    // ==================== Actions ====================

    /**
     * 初始化应用
     * 获取应用版本、数据目录等基本信息
     */
    async function initialize() {
      if (isInitialized.value) {
        logger.info('App already initialized')
        return
      }

      isLoading.value = true
      error.value = null

      try {
        logger.info('Initializing app...')

        // 并行获取应用信息
        const [appVersion, appDataDir, sysInfo] = await Promise.all([
          api.app.getVersion().catch(err => {
            logger.warn('Failed to get app version:', err)
            return 'Unknown'
          }),
          api.app.getDataDir().catch(err => {
            logger.warn('Failed to get data dir:', err)
            return ''
          }),
          api.system.getSystemInfo().catch(err => {
            logger.warn('Failed to get system info:', err)
            return null
          }),
        ])

        version.value = appVersion
        dataDir.value = appDataDir
        systemInfo.value = sysInfo
        isInitialized.value = true

        logger.info('App initialized successfully', {
          version: version.value,
          dataDir: dataDir.value,
          systemInfo: systemInfo.value,
        })
      } catch (err) {
        error.value = err
        logger.error('Failed to initialize app:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    }

    /**
     * 重置应用状态
     */
    function reset() {
      version.value = ''
      dataDir.value = ''
      systemInfo.value = null
      isInitialized.value = false
      isLoading.value = false
      error.value = null
      logger.info('App state reset')
    }

    /**
     * 清除错误
     */
    function clearError() {
      error.value = null
    }

    /**
     * 获取系统信息
     */
    async function getSystemInfo() {
      try {
        logger.debug('Getting system info...')
        const info = await api.system.getSystemInfo()
        logger.debug('System info:', info)
        return info
      } catch (err) {
        logger.error('Failed to get system info:', err)
        throw err
      }
    }

    // ==================== Return ====================
    return {
      // State
      version,
      dataDir,
      systemInfo,
      isInitialized,
      isLoading,
      error,

      // Getters
      appInfo,
      hasError,

      // Actions
      initialize,
      reset,
      clearError,
      getSystemInfo,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'app-store',
      storage: localStorage,
      paths: ['version', 'dataDir', 'systemInfo'],
    },
  }
)
