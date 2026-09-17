<template>
  <teleport to="body">
    <div v-if="visible" class="overlay" @click="close">
      <div class="panel" @click.stop>
        <div class="header">
          <div>
            <h2 class="title">{{ title }}</h2>
            <p class="sender" v-if="senderName">{{ senderName }}</p>
          </div>
          <button class="icon-btn" @click="close">✕</button>
        </div>
        <img class="preview" :src="imageSrc" :alt="fileName" @error="onImageError" />
        <div class="actions">
          <button v-if="localPath" class="btn-secondary" @click="openLocal">打开文件</button>
          <button class="btn-primary" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { onAgentPushAttachment } from '@/services/agentBridge'
import { getApiBase } from '@/config/api'

const visible = ref(false)
const title = ref('通知')
const senderName = ref('')
const fileName = ref('')
const imageSrc = ref('')
const localPath = ref('')
const remoteUrl = ref('')

function resolveUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = getApiBase().replace(/\/$/, '')
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}

function close() {
  visible.value = false
}

async function openLocal() {
  if (!localPath.value) return
  try {
    await invoke('attachment_open_file', { path: localPath.value })
  } catch (error) {
    console.error(error)
  }
}

function buildImageSrc(path, url) {
  if (path) {
    try {
      return convertFileSrc(path)
    } catch (error) {
      console.error('本地图片路径转换失败:', error)
    }
  }
  return resolveUrl(url)
}

function show(payload) {
  const data = payload.data || {}
  const result = payload.result || {}
  title.value = data.title || '通知'
  senderName.value = data.senderName || ''
  fileName.value = data.fileName || '图片'
  localPath.value = data.localPath || result.local_path || ''
  remoteUrl.value = data.fileUrl || ''
  imageSrc.value = buildImageSrc(localPath.value, remoteUrl.value)
  visible.value = true
}

/** 本地 asset 协议失败时回退远程 URL */
function onImageError() {
  const fallback = resolveUrl(remoteUrl.value)
  if (fallback && imageSrc.value !== fallback) {
    imageSrc.value = fallback
  }
}

let unlisten = null

onMounted(async () => {
  unlisten = await onAgentPushAttachment(payload => {
    const result = payload.result || {}
    const data = payload.data || {}
    const shouldDisplay =
      result.should_display === true ||
      data.shouldDisplay === true ||
      ((data.mimeType || '').startsWith('image/') &&
        (data.action === 'DISPLAY' || data.action === 'BOTH'))
    if (!shouldDisplay) return
    show(payload)
  })
})

onUnmounted(() => {
  unlisten?.()
  close()
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 24px;
}

.panel {
  width: min(920px, 96vw);
  max-height: 92vh;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 12px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.sender {
  margin: 6px 0 0;
  font-size: 14px;
  color: #6b7280;
}

.icon-btn {
  border: none;
  background: #f3f4f6;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.preview {
  width: 100%;
  max-height: calc(92vh - 160px);
  object-fit: contain;
  background: #111827;
}

.actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #07c160;
  color: #fff;
}

.btn-secondary {
  background: #eef2ff;
  color: #4338ca;
}
</style>
