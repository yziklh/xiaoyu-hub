<template>
  <div class="files-page">
    <section class="page-header">
      <h1 class="page-title">文件与资源</h1>
      <p class="page-desc">接收到的课件、图片等文件保存在本地，可随时打开查看。</p>
      <p class="page-path" v-if="downloadDir">保存目录：{{ downloadDir }}</p>
    </section>

    <section class="card" v-if="loading">
      <p class="empty-desc">加载中…</p>
    </section>

    <section class="card empty-card" v-else-if="!files.length">
      <div class="empty-icon">📁</div>
      <h3 class="empty-title">暂无接收文件</h3>
      <p class="empty-desc">当老师通过喊话发送附件后，文件会自动保存到这里。</p>
    </section>

    <section class="card list-card" v-else>
      <div class="file-row" v-for="item in files" :key="item.localPath">
        <div class="file-icon">{{ isImage(item.mimeType) ? '🖼️' : '📄' }}</div>
        <div class="file-main">
          <div class="file-name">{{ item.fileName }}</div>
          <div class="file-meta">
            <span>{{ formatSize(item.fileSize) }}</span>
            <span>{{ formatTime(item.receivedAt) }}</span>
            <span v-if="item.senderName">来自 {{ item.senderName }}</span>
          </div>
        </div>
        <button class="open-btn" @click="openFile(item.localPath)">打开</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { onAgentPushAttachment } from '@/services/agentBridge'

const files = ref([])
const downloadDir = ref('')
const loading = ref(true)

function isImage(mimeType) {
  return (mimeType || '').startsWith('image/')
}

function formatSize(size) {
  if (!size) return '--'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

async function loadFiles() {
  loading.value = true
  try {
    downloadDir.value = await invoke('attachment_get_download_dir')
    files.value = await invoke('attachment_list_files')
  } catch (error) {
    console.error(error)
    files.value = []
  } finally {
    loading.value = false
  }
}

async function openFile(path) {
  try {
    await invoke('attachment_open_file', { path })
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  await loadFiles()
  await onAgentPushAttachment(() => {
    loadFiles()
  })
})
</script>

<style scoped>
.files-page {
  max-width: 760px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
}

.page-desc,
.page-path {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.7;
}

.page-path {
  margin-top: 8px;
  word-break: break-all;
}

.card {
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
}

.empty-card {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6b7280;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
}

.file-row + .file-row {
  border-top: 1px solid #eef2f7;
}

.file-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.file-main {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.open-btn {
  border: none;
  background: #eef2ff;
  color: #4338ca;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
