<template>
  <div class="app-container">
    <!-- 自定义标题栏 -->
    <Titlebar />

    <!-- 主布局容器 -->
    <div class="app-main-layout">
      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 路由视图 -->
        <main class="tab-content-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" class="tab-content" />
            </transition>
          </router-view>
        </main>

        <!-- 底部组件 -->
        <MainFooter />

        <!-- 全局 Toast 通知 -->
        <Toast />

        <!-- 喊话弹窗 -->
        <BroadcastOverlay />
      </div>

      <!-- 右侧垂直标签导航 -->
      <Sidebar />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Titlebar from './Titlebar.vue'
import Sidebar from './Sidebar.vue'
import MainFooter from './MainFooter.vue'
import BroadcastOverlay from '@/components/features/BroadcastOverlay.vue'
import { useDeviceStore } from '@/stores/device'
import { onAgentCommandReceived } from '@/services/agentBridge'
import { logger } from '@/utils/logger'

const deviceStore = useDeviceStore()

onMounted(async () => {
  onAgentCommandReceived(envelope => {
    deviceStore.recordCommand(envelope)
  })

  try {
    await deviceStore.bootstrap()
    deviceStore.addActivity('系统启动', '教室小助手已就绪', '运行正常')
  } catch (error) {
    logger.error('设备初始化失败:', error)
  }
})
</script>

<style scoped>
.app-container {
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  font-family: var(--font-family);
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
}

.app-main-layout {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--bg-secondary);
  margin: 4px;
  position: relative; /* 作为 Toast 的定位参考 */
}

.tab-content-container {
  flex: 1;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
}

.tab-content {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: var(--spacing-lg);
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
