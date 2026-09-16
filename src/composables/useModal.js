// ref 已通过 unplugin-auto-import 自动导入
import { logger } from '@/utils/logger'

/**
 * Modal 弹窗 Composable
 * 提供可复用的弹窗状态管理
 */
export function useModal(initialState = false) {
  // ==================== State ====================
  const isOpen = ref(initialState)
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ==================== Methods ====================

  /**
   * 打开弹窗
   * @param {any} modalData - 传递给弹窗的数据
   */
  function openModal(modalData = null) {
    data.value = modalData
    isOpen.value = true
    error.value = null
    logger.debug('Modal opened', modalData)
  }

  /**
   * 关闭弹窗
   */
  function closeModal() {
    isOpen.value = false
    // 延迟清除数据，等待动画完成
    setTimeout(() => {
      data.value = null
      error.value = null
      loading.value = false
    }, 300)
    logger.debug('Modal closed')
  }

  /**
   * 切换弹窗状态
   */
  function toggleModal() {
    if (isOpen.value) {
      closeModal()
    } else {
      openModal()
    }
  }

  /**
   * 设置加载状态
   * @param {boolean} state - 加载状态
   */
  function setLoading(state) {
    loading.value = state
  }

  /**
   * 设置错误
   * @param {Error|string} err - 错误对象或错误消息
   */
  function setError(err) {
    error.value = err
    logger.error('Modal error:', err)
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null
  }

  /**
   * 更新弹窗数据
   * @param {any} newData - 新数据
   */
  function updateData(newData) {
    data.value = newData
  }

  /**
   * 重置弹窗状态
   */
  function reset() {
    isOpen.value = false
    data.value = null
    loading.value = false
    error.value = null
    logger.debug('Modal reset')
  }

  return {
    // State
    isOpen,
    data,
    loading,
    error,

    // Methods
    openModal,
    closeModal,
    toggleModal,
    setLoading,
    setError,
    clearError,
    updateData,
    reset,
  }
}
