<template>
  <div class="dashboard-page">
    <div class="dashboard-grid">
      <div class="dashboard-main">
        <!-- 顶部欢迎区 -->
        <section class="hero">
          <div class="hero-content">
            <h1 class="hero-title">你好，这里是教室小助手！</h1>
            <p class="hero-sub">默默守护每一堂课，让课堂更专注、更高效。</p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="hero-board">新的开始 加油！</div>
            <div class="hero-robot">🤖</div>
          </div>
        </section>

        <!-- 运行状态：未绑定或离线时可点击跳转设备管理 -->
        <section
          class="runtime-card"
          :class="[statusClass, { clickable: canGoDevice }]"
          @click="goDeviceIfNeeded"
        >
          <div class="runtime-left">
            <div class="runtime-icon">🖥</div>
            <div>
              <div class="runtime-title">{{ statusTitle }}</div>
              <div class="runtime-desc">{{ runtimeDesc }}</div>
            </div>
          </div>
          <div class="runtime-badge">{{ statusBadge }}</div>
        </section>

        <!-- 功能中心 -->
        <section class="section-block">
          <div class="section-head">
            <h2 class="section-title">功能中心</h2>
            <span class="section-sub">让教学更简单</span>
          </div>
          <div class="function-grid">
            <button
              v-for="item in functionItems"
              :key="item.path"
              class="function-card"
              :class="item.theme"
              @click="go(item.path)"
            >
              <span class="function-icon">{{ item.icon }}</span>
              <span class="function-name">{{ item.name }}</span>
              <span class="function-desc">{{ item.desc }}</span>
            </button>
          </div>
        </section>

        <!-- 今日概览 -->
        <section class="section-block">
          <div class="section-head">
            <h2 class="section-title">今日课堂概览</h2>
          </div>
          <div class="overview-grid">
            <div v-for="item in overviewItems" :key="item.label" class="overview-card">
              <div class="overview-icon">{{ item.icon }}</div>
              <div class="overview-value">{{ item.value }}</div>
              <div class="overview-label">{{ item.label }}</div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：时间 + 最近动态 -->
      <aside class="dashboard-side">
        <ClockWidget />
        <ActivityTimeline :items="deviceStore.activities" :limit="4" show-more />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'
import { ROUTES } from '@/constants/routes'
import ClockWidget from '@/components/features/ClockWidget.vue'
import ActivityTimeline from '@/components/features/ActivityTimeline.vue'

const router = useRouter()
const deviceStore = useDeviceStore()
const uptimeText = ref('0分钟')

const functionItems = [
  { name: '通知中心', desc: '文字 / 语音 / 弹窗', icon: '📢', path: ROUTES.NOTIFICATIONS, theme: 'blue' },
  { name: '设备管理', desc: '设备状态 / 班级信息', icon: '🖥', path: ROUTES.DEVICE, theme: 'green' },
  { name: '文件与资源', desc: '课件下发 / 资源管理', icon: '📁', path: ROUTES.FILES, theme: 'orange' },
]

const statusClass = computed(() => {
  if (!deviceStore.isBound) return 'waiting'
  const map = { online: 'online', connecting: 'connecting', reconnecting: 'connecting', offline: 'offline' }
  return map[deviceStore.connectionStatus] || 'offline'
})

const statusTitle = computed(() => {
  if (!deviceStore.isBound) return '等待连接设备'
  const map = { online: '运行正常', connecting: '连接中', reconnecting: '重连中', offline: '连接断开' }
  return map[deviceStore.connectionStatus] || '离线'
})

const canGoDevice = computed(() => !deviceStore.isBound || !deviceStore.isOnline)

const statusBadge = computed(() => {
  if (!deviceStore.isBound) return '前往设备管理连接 →'
  if (!deviceStore.isOnline) return '前往设备管理重连 →'
  return '一切正常 · 教室小助手正在守护课堂'
})

const runtimeDesc = computed(() => {
  if (!deviceStore.isBound) {
    return '尚未绑定班级设备，请前往设备管理完成连接'
  }
  const classInfo = [deviceStore.deptName, deviceStore.deviceName].filter(Boolean).join(' · ') || '已绑定设备'
  const sync = deviceStore.lastSyncTime ? `最后同步：${deviceStore.lastSyncTime}` : '等待首次同步'
  const cloud = deviceStore.isOnline ? '已连接云端' : '云端未连接'
  return `${classInfo} | ${cloud} · ${sync}`
})

const overviewItems = computed(() => [
  { icon: '⏱', label: '在线时长', value: uptimeText.value },
  { icon: '🔔', label: '收到通知', value: `${deviceStore.stats.notificationCount} 次` },
  { icon: '🎙', label: '语音播报', value: `${deviceStore.stats.ttsCount} 次` },
  {
    icon: '⚙',
    label: '系统运行',
    value: deviceStore.isOnline ? '正常' : '待连接',
  },
])

let uptimeTimer = null

function formatUptime(ms) {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  return `${minutes} 分钟`
}

function updateUptime() {
  uptimeText.value = formatUptime(Date.now() - deviceStore.sessionStartAt)
}

function go(path) {
  router.push(path)
}

/** 未绑定或离线时跳转设备管理页 */
function goDeviceIfNeeded() {
  if (canGoDevice.value) {
    router.push(ROUTES.DEVICE)
  }
}

onMounted(() => {
  updateUptime()
  uptimeTimer = setInterval(updateUptime, 60000)
})

onUnmounted(() => {
  if (uptimeTimer) clearInterval(uptimeTimer)
})
</script>

<style scoped>
.dashboard-page {
  margin: calc(-1 * var(--spacing-lg));
  min-height: calc(100% + 2 * var(--spacing-lg));
  background: #f3f6fb;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  padding: 20px;
  min-height: 100%;
  box-sizing: border-box;
}

.dashboard-main {
  min-width: 0;
}

.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  align-self: stretch;
}

.hero {
  position: relative;
  overflow: hidden;
  min-height: 160px;
  padding: 28px 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 45%, #ecfccb 100%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 12px 30px rgba(59, 130, 246, 0.08);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 60%;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.hero-sub {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.hero-art {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-board {
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.hero-robot {
  font-size: 56px;
  filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.12));
}

.runtime-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 18px 22px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #dbeafe;
}

.runtime-card.clickable {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.runtime-card.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 35, 52, 0.08);
}

.runtime-card.clickable:active {
  transform: translateY(0);
}

.runtime-card.online {
  background: linear-gradient(90deg, #ecfdf5, #f0fdf4);
  border-color: #bbf7d0;
}

.runtime-card.waiting,
.runtime-card.offline {
  background: linear-gradient(90deg, #fffbeb, #fef3c7);
  border-color: #fde68a;
}

.runtime-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.runtime-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.runtime-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.runtime-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-badge {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  color: #059669;
}

.section-block {
  margin-top: 20px;
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.section-sub {
  font-size: 13px;
  color: #9ca3af;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.function-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px;
  border: 1px solid #e8eef3;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.function-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 35, 52, 0.08);
}

.function-card.blue {
  background: linear-gradient(180deg, #eff6ff, #fff);
}

.function-card.green {
  background: linear-gradient(180deg, #ecfdf5, #fff);
}

.function-card.orange {
  background: linear-gradient(180deg, #fff7ed, #fff);
}

.function-icon {
  font-size: 28px;
}

.function-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.function-desc {
  font-size: 12px;
  color: #6b7280;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  padding: 18px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
  text-align: center;
}

.overview-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.overview-label {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-side {
    display: grid;
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 820px) {
  .hero-content {
    max-width: 100%;
  }

  .hero-art {
    display: none;
  }

  .function-grid,
  .overview-grid,
  .dashboard-side {
    grid-template-columns: 1fr;
  }

  .runtime-desc {
    white-space: normal;
  }
}
</style>
