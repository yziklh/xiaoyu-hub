<template>
  <div class="clock-widget">
    <div class="time">{{ timeText }}</div>
    <div class="date">{{ dateText }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const timeText = ref('')
const dateText = ref('')
let timer = null

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function tick() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  timeText.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  dateText.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.clock-widget {
  padding: 20px 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
  box-shadow: 0 8px 24px rgba(15, 35, 52, 0.06);
}

.time {
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  color: #1f2937;
  letter-spacing: 1px;
}

.date {
  margin-top: 10px;
  font-size: 14px;
  color: #6b7280;
}
</style>
