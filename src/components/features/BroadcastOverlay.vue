<template>
  <teleport to="body">
    <div v-if="visible" class="overlay" :class="{ fullscreen }" @click="close">
      <div class="panel" @click.stop>
        <h2 class="title">{{ title }}</h2>
        <p class="content">{{ content }}</p>
        <button class="close-btn" @click="close">知道了</button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onAgentShowMessage } from '@/services/agentBridge'

const visible = ref(false)
const title = ref('')
const content = ref('')
const fullscreen = ref(true)
let timer = null

function close() {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function show(payload) {
  title.value = payload.title || '通知'
  content.value = payload.content || ''
  fullscreen.value = payload.fullscreen !== false
  visible.value = true

  if (timer) clearTimeout(timer)
  const duration = (payload.duration ?? 10) * 1000
  if (duration > 0) {
    timer = setTimeout(close, duration)
  }
}

let unlistenShowMessage = null

onMounted(async () => {
  unlistenShowMessage = await onAgentShowMessage(payload => {
    show({
      title: payload.title,
      content: payload.content,
      duration: payload.duration,
      fullscreen: payload.fullscreen,
    })
  })
})

onUnmounted(() => {
  unlistenShowMessage?.()
  close()
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.overlay.fullscreen {
  background: rgba(5, 155, 75, 0.92);
}

.panel {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.fullscreen .panel {
  max-width: 640px;
  text-align: center;
}

.title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.content {
  margin: 0 0 24px;
  font-size: 20px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
}

.close-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 999px;
  background: #07c160;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>
