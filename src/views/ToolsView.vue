<template>
  <div class="tools-tab-container">
    <!-- 页面标题 -->
    <div class="header-section">
      <h2><icon-proicons-wrench /> 系统工具</h2>
      <p class="description">文件操作、系统命令和实用工具</p>
    </div>

    <!-- 工具分类 -->
    <div class="tools-sections">
      <!-- 文件工具 -->
      <section class="tool-section">
        <h3><icon-proicons-folder /> 文件工具</h3>
        <div class="tool-grid">
          <!-- 文件选择器 -->
          <div class="tool-card">
            <h4>文件选择器</h4>
            <div class="tool-content">
              <button class="btn btn-primary" @click="selectFile">选择文件</button>
              <button class="btn btn-secondary" @click="selectMultipleFiles">选择多个文件</button>
              <button class="btn btn-outline" @click="selectDirectory">选择目录</button>
              <div v-if="selectedFiles.length > 0" class="result-box">
                <p class="result-title">已选择 {{ selectedFiles.length }} 个文件:</p>
                <ul class="file-list">
                  <li v-for="(file, index) in selectedFiles" :key="index">{{ file }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 文件读写 -->
          <div class="tool-card">
            <h4>文件读写</h4>
            <div class="tool-content">
              <input v-model="filePath" type="text" class="input" placeholder="文件路径" />
              <button class="btn btn-primary" @click="readFileContent">读取文件</button>
              <button class="btn btn-secondary" @click="writeFileContent">写入文件</button>
              <button class="btn btn-outline" @click="checkFileExists">检查文件是否存在</button>
              <textarea
                v-if="fileContentText"
                v-model="fileContentText"
                class="input textarea"
                placeholder="文件内容"
              ></textarea>
              <p v-if="fileExistsResult !== null" class="result-text">文件{{ fileExistsResult ? '存在' : '不存在' }}</p>
            </div>
          </div>

          <!-- 文件保存对话框 -->
          <div class="tool-card">
            <h4>保存文件对话框</h4>
            <div class="tool-content">
              <textarea v-model="saveContent" class="input textarea" placeholder="输入要保存的内容"></textarea>
              <button class="btn btn-primary" @click="showSaveDialog">保存为文件</button>
              <p v-if="savedFilePath" class="result-text">已保存到: {{ savedFilePath }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 系统工具 -->
      <section class="tool-section">
        <h3><icon-proicons-computer /> 系统工具</h3>
        <div class="tool-grid">
          <!-- 系统信息 -->
          <div class="tool-card">
            <h4>系统信息</h4>
            <div class="tool-content">
              <button class="btn btn-primary" @click="loadSystemInfo">刷新系统信息</button>
              <div v-if="systemInfo" class="info-box">
                <div class="info-item">
                  <span class="info-label">操作系统:</span>
                  <span class="info-value">{{ systemInfo.os }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">架构:</span>
                  <span class="info-value">{{ systemInfo.arch }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">系统版本:</span>
                  <span class="info-value">{{ systemInfo.os_version }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 实用工具 -->
      <section class="tool-section">
        <h3>🔧 实用工具</h3>
        <div class="tool-grid">
          <!-- 文本工具 -->
          <div class="tool-card">
            <h4>文本工具</h4>
            <div class="tool-content">
              <textarea v-model="textToolInput" class="input textarea" placeholder="输入文本"></textarea>
              <div class="button-group">
                <button class="btn btn-sm btn-secondary" @click="toUpperCase">转大写</button>
                <button class="btn btn-sm btn-secondary" @click="toLowerCase">转小写</button>
                <button class="btn btn-sm btn-secondary" @click="reverseText">反转</button>
                <button class="btn btn-sm btn-secondary" @click="getTextLength">字符数</button>
              </div>
              <p v-if="textToolResult" class="result-text">{{ textToolResult }}</p>
            </div>
          </div>

          <!-- Base64 编解码 -->
          <div class="tool-card">
            <h4>Base64 编解码</h4>
            <div class="tool-content">
              <textarea v-model="base64Input" class="input textarea" placeholder="输入文本"></textarea>
              <div class="button-group">
                <button class="btn btn-sm btn-primary" @click="encodeBase64">编码</button>
                <button class="btn btn-sm btn-secondary" @click="decodeBase64">解码</button>
              </div>
              <p v-if="base64Result" class="result-text">{{ base64Result }}</p>
            </div>
          </div>

          <!-- JSON 格式化 -->
          <div class="tool-card">
            <h4>JSON 格式化</h4>
            <div class="tool-content">
              <textarea
                v-model="jsonInput"
                class="input textarea"
                placeholder='输入 JSON (例如: {"name":"test"})'
              ></textarea>
              <div class="button-group">
                <button class="btn btn-sm btn-primary" @click="formatJSON">格式化</button>
                <button class="btn btn-sm btn-secondary" @click="minifyJSON">压缩</button>
              </div>
              <pre v-if="jsonResult" class="result-box">{{ jsonResult }}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@api'
import { useToast } from '@composables/useToast'

// 使用全局 Toast
const toast = useToast()

// 文件工具状态
const selectedFiles = ref([])
const filePath = ref('')
const fileContentText = ref('')
const fileExistsResult = ref(null)
const saveContent = ref('')
const savedFilePath = ref('')

// 系统工具状态
const systemInfo = ref(null)

// 实用工具状态
const textToolInput = ref('')
const textToolResult = ref('')
const base64Input = ref('')
const base64Result = ref('')
const jsonInput = ref('')
const jsonResult = ref('')

// 文件工具方法
const selectFile = async () => {
  try {
    const path = await api.file.selectFile()
    if (path) {
      selectedFiles.value = [path]
      toast.success('文件已选择')
    }
  } catch (error) {
    toast.error(`选择文件失败: ${error.message}`)
  }
}

const selectMultipleFiles = async () => {
  try {
    const paths = await api.file.selectMultipleFiles()
    if (paths && paths.length > 0) {
      selectedFiles.value = paths
      toast.success(`已选择 ${paths.length} 个文件`)
    }
  } catch (error) {
    toast.error(`选择文件失败: ${error.message}`)
  }
}

const selectDirectory = async () => {
  try {
    const path = await api.file.selectDirectory()
    if (path) {
      selectedFiles.value = [path]
      toast.success('目录已选择')
    }
  } catch (error) {
    toast.error(`选择目录失败: ${error.message}`)
  }
}

const readFileContent = async () => {
  try {
    if (!filePath.value) {
      toast.warning('请输入文件路径')
      return
    }
    const content = await api.system.readFile(filePath.value)
    fileContentText.value = content
    toast.success('文件已读取')
  } catch (error) {
    toast.error(`读取文件失败: ${error.message}`)
  }
}

const writeFileContent = async () => {
  try {
    if (!filePath.value || !fileContentText.value) {
      toast.warning('请输入文件路径和内容')
      return
    }
    await api.system.writeFile(filePath.value, fileContentText.value)
    toast.success('文件已写入')
  } catch (error) {
    toast.error(`写入文件失败: ${error.message}`)
  }
}

const checkFileExists = async () => {
  try {
    if (!filePath.value) {
      toast.warning('请输入文件路径')
      return
    }
    const exists = await api.system.fileExists(filePath.value)
    fileExistsResult.value = exists
    toast.info(exists ? '文件存在' : '文件不存在')
  } catch (error) {
    toast.error(`检查文件失败: ${error.message}`)
  }
}

const showSaveDialog = async () => {
  try {
    if (!saveContent.value) {
      toast.warning('请输入要保存的内容')
      return
    }
    const path = await api.file.saveTextFile(saveContent.value)
    if (path) {
      savedFilePath.value = path
      toast.success('文件已保存')
    }
  } catch (error) {
    toast.error(`保存文件失败: ${error.message}`)
  }
}

// 系统工具方法
const loadSystemInfo = async () => {
  try {
    systemInfo.value = await api.system.getSystemInfo()
    toast.success('系统信息已刷新')
  } catch (error) {
    toast.error(`获取系统信息失败: ${error.message}`)
  }
}

// 实用工具方法
const toUpperCase = () => {
  textToolResult.value = textToolInput.value.toUpperCase()
}

const toLowerCase = () => {
  textToolResult.value = textToolInput.value.toLowerCase()
}

const reverseText = () => {
  textToolResult.value = textToolInput.value.split('').reverse().join('')
}

const getTextLength = () => {
  textToolResult.value = `字符数: ${textToolInput.value.length}`
}

const encodeBase64 = () => {
  try {
    base64Result.value = btoa(base64Input.value)
    toast.success('Base64 编码完成')
  } catch (error) {
    toast.error(`编码失败: ${error.message}`)
  }
}

const decodeBase64 = () => {
  try {
    base64Result.value = atob(base64Input.value)
    toast.success('Base64 解码完成')
  } catch (error) {
    toast.error(`解码失败: ${error.message}`)
  }
}

const formatJSON = () => {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonResult.value = JSON.stringify(obj, null, 2)
    toast.success('JSON 格式化完成')
  } catch (error) {
    toast.error(`格式化失败: ${error.message}`)
  }
}

const minifyJSON = () => {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonResult.value = JSON.stringify(obj)
    toast.success('JSON 压缩完成')
  } catch (error) {
    toast.error(`压缩失败: ${error.message}`)
  }
}

// 组件挂载时加载系统信息
onMounted(async () => {
  await loadSystemInfo()
})
</script>

<style scoped>
.tools-tab-container {
  padding: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.header-section {
  margin-bottom: var(--spacing-lg);
}

.description {
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
}

.tools-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.tool-section h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing);
  font-size: var(--font-size-lg);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing);
}

.tool-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing);
  border: 1px solid var(--border-light);
}

.tool-card h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size);
}

.tool-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--text-primary);
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input {
  padding: var(--spacing-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
}

.textarea {
  min-height: 100px;
  resize: vertical;
  font-family: monospace;
}

.button-group {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.result-box {
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.result-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-list li {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-xs) 0;
  word-break: break-all;
}

.result-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius);
  word-break: break-all;
}

.output-box,
.error-box {
  padding: var(--spacing-sm);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.output-box {
  background: var(--bg-primary);
}

.error-box {
  background: #fee2e2;
  border-color: #dc2626;
}

.output-title,
.error-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.error-title {
  color: #dc2626;
}

.output-box pre,
.error-box pre,
.result-box pre {
  margin: 0;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
}

.info-box {
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
}
</style>
