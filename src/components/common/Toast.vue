<template>
  <TransitionGroup name="toast-list" tag="div" class="toast-container">
    <div
      v-for="(toast, index) in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
      role="alert"
      aria-live="polite"
      @mouseenter="pauseToast(toast.id)"
      @mouseleave="resumeToast(toast.id)"
    >
      <div class="toast-icon">
        <component :is="getIconComponent(toast.type)" />
      </div>
      <div class="toast-content">
        <div class="toast-message">{{ toast.message }}</div>
      </div>
      <button class="toast-close" aria-label="关闭通知" @click="hideToast(toast.id)">×</button>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { useToast } from '@composables/useToast'
import IconProiconsCheckmarkCircle from '~icons/proicons/checkmark-circle'
import IconProiconsCancelCircle from '~icons/proicons/cancel-circle'
import IconProiconsAlertCircle from '~icons/proicons/alert-circle'
import IconProiconsInfo from '~icons/proicons/info'

// 禁用属性继承（因为使用了 Teleport 根节点）
defineOptions({
  inheritAttrs: false,
})

// 使用 Toast composable
const { toasts, hideToast, pauseToast, resumeToast } = useToast()

// 获取图标组件（接收 type 参数）
function getIconComponent(type) {
  const iconMap = {
    success: IconProiconsCheckmarkCircle,
    error: IconProiconsCancelCircle,
    warning: IconProiconsAlertCircle,
    info: IconProiconsInfo,
  }
  return iconMap[type] || IconProiconsInfo
}
</script>

<style scoped>
/* Toast 容器 */
.toast-container {
  position: absolute;
  top: 20px;
  right: 20px; /* 相对于 main-content 的右侧 */
  z-index: 2000;
  pointer-events: none; /* 容器不拦截事件 */
  display: flex;
  flex-direction: column;
  gap: 8px; /* toast 之间的间距 */
}

/* 单个 Toast */
.toast {
  min-width: 300px;
  max-width: 400px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing);
  border-left: 4px solid;
  pointer-events: auto; /* toast 本身可以交互 */
  position: relative; /* 改为相对定位 */
  transition: all 0.3s ease; /* 位置变化动画 */
}

/* Toast 类型样式 */
.toast-success {
  border-left-color: var(--success-color);
}

.toast-error {
  border-left-color: var(--danger-color);
}

.toast-warning {
  border-left-color: var(--warning-color);
}

.toast-info {
  border-left-color: var(--primary-color);
}

/* 图标样式 */
.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.toast-success .toast-icon {
  color: var(--success-color);
}

.toast-error .toast-icon {
  color: var(--danger-color);
}

.toast-warning .toast-icon {
  color: var(--warning-color);
}

.toast-info .toast-icon {
  color: var(--primary-color);
}

/* 内容样式 */
.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  word-wrap: break-word;
}

/* 关闭按钮 */
.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  transition: all var(--transition-fast);
}

.toast-close:hover {
  background: var(--gray-200);
  color: var(--text-primary);
}

/* TransitionGroup 动画 */
.toast-list-enter-active {
  transition: all 0.3s ease;
}

.toast-list-leave-active {
  transition: all 0.3s ease;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%); /* 从主内容区域右侧滑入 */
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%); /* 向主内容区域右侧滑出 */
}

/* 移动动画（其他 toast 位置调整） */
.toast-list-move {
  transition: transform 0.3s ease;
}
</style>
