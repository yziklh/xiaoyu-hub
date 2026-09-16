// defineStore 已通过 unplugin-auto-import 自动导入
// ref, watch 已通过 unplugin-auto-import 自动导入
import { logger } from '@/utils/logger'

/**
 * 设置 Store
 * 管理应用设置，如语言、自动更新等
 * 使用 pinia-plugin-persistedstate 自动持久化到 localStorage
 */
export const useSettingsStore = defineStore(
  'settings',
  () => {
    // ==================== State ====================
    const language = ref('zh-CN')
    const autoUpdate = ref(true)
    const enableNotifications = ref(true)
    const enableSounds = ref(true)
    const fontSize = ref('medium') // small, medium, large

    // ==================== Constants ====================
    const AVAILABLE_LANGUAGES = ['zh-CN', 'en-US']
    const AVAILABLE_FONT_SIZES = ['small', 'medium', 'large']

    // ==================== Actions ====================

    /**
     * 设置语言
     * @param {string} lang - 语言代码
     */
    function setLanguage(lang) {
      if (!AVAILABLE_LANGUAGES.includes(lang)) {
        logger.warn(`Invalid language: ${lang}`)
        return
      }

      language.value = lang
      logger.info(`Language changed to: ${lang}`)
    }

    /**
     * 设置自动更新
     * @param {boolean} enabled - 是否启用
     */
    function setAutoUpdate(enabled) {
      autoUpdate.value = enabled
      logger.info(`Auto update ${enabled ? 'enabled' : 'disabled'}`)
    }

    /**
     * 切换自动更新
     */
    function toggleAutoUpdate() {
      setAutoUpdate(!autoUpdate.value)
    }

    /**
     * 设置通知
     * @param {boolean} enabled - 是否启用
     */
    function setNotifications(enabled) {
      enableNotifications.value = enabled
      logger.info(`Notifications ${enabled ? 'enabled' : 'disabled'}`)
    }

    /**
     * 切换通知
     */
    function toggleNotifications() {
      setNotifications(!enableNotifications.value)
    }

    /**
     * 设置声音
     * @param {boolean} enabled - 是否启用
     */
    function setSounds(enabled) {
      enableSounds.value = enabled
      logger.info(`Sounds ${enabled ? 'enabled' : 'disabled'}`)
    }

    /**
     * 切换声音
     */
    function toggleSounds() {
      setSounds(!enableSounds.value)
    }

    /**
     * 设置字体大小
     * @param {string} size - 字体大小 (small, medium, large)
     */
    function setFontSize(size) {
      if (!AVAILABLE_FONT_SIZES.includes(size)) {
        logger.warn(`Invalid font size: ${size}`)
        return
      }

      fontSize.value = size
      applyFontSize(size)
      logger.info(`Font size changed to: ${size}`)
    }

    /**
     * 应用字体大小到 DOM
     * @param {string} size - 字体大小
     */
    function applyFontSize(size) {
      const sizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
      }

      document.documentElement.style.fontSize = sizeMap[size] || sizeMap.medium
    }

    /**
     * 初始化设置（应用字体大小）
     * 由于使用了持久化插件，数据会自动加载，这里只需要应用到 DOM
     */
    function initializeSettings() {
      applyFontSize(fontSize.value)
      logger.info('Settings initialized and applied to DOM')
    }

    /**
     * 重置所有设置为默认值
     */
    function resetSettings() {
      language.value = 'zh-CN'
      autoUpdate.value = true
      enableNotifications.value = true
      enableSounds.value = true
      fontSize.value = 'medium'

      applyFontSize('medium')

      logger.info('Settings reset to defaults')
    }

    /**
     * 导出设置
     * @returns {Object} 设置对象
     */
    function exportSettings() {
      return {
        language: language.value,
        autoUpdate: autoUpdate.value,
        enableNotifications: enableNotifications.value,
        enableSounds: enableSounds.value,
        fontSize: fontSize.value,
      }
    }

    /**
     * 导入设置
     * @param {Object} settings - 设置对象
     */
    function importSettings(settings) {
      if (settings.language) {
        setLanguage(settings.language)
      }
      if (typeof settings.autoUpdate === 'boolean') {
        setAutoUpdate(settings.autoUpdate)
      }
      if (typeof settings.enableNotifications === 'boolean') {
        setNotifications(settings.enableNotifications)
      }
      if (typeof settings.enableSounds === 'boolean') {
        setSounds(settings.enableSounds)
      }
      if (settings.fontSize) {
        setFontSize(settings.fontSize)
      }

      logger.info('Settings imported')
    }

    // ==================== Return ====================
    return {
      // State
      language,
      autoUpdate,
      enableNotifications,
      enableSounds,
      fontSize,

      // Constants
      AVAILABLE_LANGUAGES,
      AVAILABLE_FONT_SIZES,

      // Actions
      setLanguage,
      setAutoUpdate,
      toggleAutoUpdate,
      setNotifications,
      toggleNotifications,
      setSounds,
      toggleSounds,
      setFontSize,
      initializeSettings,
      resetSettings,
      exportSettings,
      importSettings,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'app-settings',
      storage: localStorage,
      paths: ['language', 'autoUpdate', 'enableNotifications', 'enableSounds', 'fontSize'],
    },
  }
)
