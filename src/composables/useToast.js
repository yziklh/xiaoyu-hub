// ref, readonly 已通过 unplugin-auto-import 自动导入
import { logger } from '@/utils/logger'

/**
 * Toast 通知 Composable
 * 提供全局的 Toast 通知功能
 * 支持多个 toast 同时显示（最多 5 个）
 */

// 全局状态（数组队列管理）
const toasts = ref([])
const MAX_TOASTS = 5

/**
 * 生成唯一 ID
 * @returns {string} 唯一标识符
 */
function generateId() {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useToast() {
  /**
   * 显示 Toast 通知
   * @param {string} type - 通知类型 (success, error, warning, info)
   * @param {string} message - 通知消息
   * @param {number} duration - 显示时长（毫秒），0 表示不自动关闭
   */
  function showToast(type, message, duration = 3000) {
    // 创建新 toast 对象
    const newToast = {
      id: generateId(),
      type,
      message,
      duration,
      timeoutId: null,
      isPaused: false,
      remainingTime: duration,
      pausedAt: null,
    }

    // 添加到数组开头（向上堆叠）
    toasts.value.unshift(newToast)

    // 如果超过最大数量，移除最早的（数组末尾）
    if (toasts.value.length > MAX_TOASTS) {
      const removed = toasts.value.pop()
      if (removed.timeoutId) {
        clearTimeout(removed.timeoutId)
      }
    }

    logger.debug(`Toast shown: [${type}] ${message}`)

    // 设置自动关闭定时器
    if (duration > 0) {
      newToast.timeoutId = setTimeout(() => {
        hideToast(newToast.id)
      }, duration)
    }
  }

  /**
   * 隐藏 Toast 通知
   * @param {string} id - Toast ID
   */
  function hideToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const toast = toasts.value[index]

      // 清除定时器
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId)
        toast.timeoutId = null
      }

      // 从数组中移除
      toasts.value.splice(index, 1)

      logger.debug('Toast hidden:', id)
    }
  }

  /**
   * 暂停 Toast 自动关闭
   * @param {string} id - Toast ID
   */
  function pauseToast(id) {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && !toast.isPaused && toast.timeoutId) {
      // 清除定时器
      clearTimeout(toast.timeoutId)
      toast.timeoutId = null

      // 记录暂停状态
      toast.isPaused = true
      toast.pausedAt = Date.now()

      logger.debug('Toast paused:', id)
    }
  }

  /**
   * 恢复 Toast 自动关闭
   * @param {string} id - Toast ID
   */
  function resumeToast(id) {
    const toast = toasts.value.find(t => t.id === id)
    if (toast && toast.isPaused) {
      // 计算剩余时间
      const elapsed = Date.now() - toast.pausedAt
      toast.remainingTime = Math.max(0, toast.remainingTime - elapsed)

      // 恢复定时器
      if (toast.remainingTime > 0) {
        toast.timeoutId = setTimeout(() => {
          hideToast(toast.id)
        }, toast.remainingTime)
      } else {
        // 如果时间已到，立即关闭
        hideToast(toast.id)
      }

      toast.isPaused = false
      toast.pausedAt = null

      logger.debug('Toast resumed:', id)
    }
  }

  /**
   * 显示成功通知
   * @param {string} message - 通知消息
   * @param {number} duration - 显示时长
   */
  function success(message, duration = 3000) {
    showToast('success', message, duration)
  }

  /**
   * 显示错误通知
   * @param {string} message - 通知消息
   * @param {number} duration - 显示时长
   */
  function error(message, duration = 4000) {
    showToast('error', message, duration)
  }

  /**
   * 显示警告通知
   * @param {string} message - 通知消息
   * @param {number} duration - 显示时长
   */
  function warning(message, duration = 3500) {
    showToast('warning', message, duration)
  }

  /**
   * 显示信息通知
   * @param {string} message - 通知消息
   * @param {number} duration - 显示时长
   */
  function info(message, duration = 3000) {
    showToast('info', message, duration)
  }

  return {
    // State
    toasts: readonly(toasts), // 只读，防止外部直接修改

    // Methods
    showToast,
    hideToast,
    pauseToast,
    resumeToast,
    success,
    error,
    warning,
    info,
  }
}
