<template>
  <div class="notification-page">
    <section class="page-header">
      <h1 class="page-title">通知中心</h1>
      <p class="page-desc">查看最近收到的课堂通知与执行记录</p>
    </section>

    <section v-if="deviceStore.lastCommand" class="card highlight">
      <div class="card-label">最新通知</div>
      <div class="command-type">{{ commandTypeLabel(deviceStore.lastCommand.type) }}</div>
      <p v-if="deviceStore.lastCommand.senderName" class="command-sender">
        {{ deviceStore.lastCommand.senderName }} 发送
      </p>
      <p class="command-text">{{ deviceStore.lastCommand.text }}</p>
      <p class="command-time">{{ deviceStore.lastCommand.time }}</p>
    </section>

    <ActivityTimeline
      :items="deviceStore.activities"
      title="全部动态"
      scrollable
      show-count
      max-height="calc(100vh - 320px)"
      fill
    />
  </div>
</template>

<script setup>
import { useDeviceStore } from '@/stores/device'
import ActivityTimeline from '@/components/features/ActivityTimeline.vue'

const deviceStore = useDeviceStore()

function commandTypeLabel(type) {
  const map = { TTS: '语音通知', SHOW_MESSAGE: '弹窗通知' }
  return map[type] || type
}
</script>

<style scoped>
.notification-page {
  max-width: 760px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-header {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.card {
  margin-bottom: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
  flex-shrink: 0;
}

.card.highlight {
  background: linear-gradient(135deg, #eff6ff, #ecfdf5);
  border-color: #bfdbfe;
}

.card-label {
  font-size: 12px;
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 8px;
}

.command-type {
  font-size: 13px;
  color: #059669;
  font-weight: 600;
  margin-bottom: 8px;
}

.command-sender {
  margin: 0 0 8px;
  font-size: 14px;
  color: #2563eb;
  font-weight: 500;
}

.command-text {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.7;
  color: #111827;
}

.command-time {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}
</style>
