<template>
  <div class="examples-tab-container">
    <!-- 页面标题 -->
    <div class="header-section">
      <h2><icon-proicons-box /> 组件示例</h2>
      <p class="description">展示 Tauri + Vue 3 的各种功能和组件示例</p>
    </div>

    <!-- 示例分类 -->
    <div class="examples-sections">
      <!-- 自定义图标示例 -->
      <section class="example-section">
        <CustomIconDemo />
      </section>

      <!-- UI 组件示例 -->
      <section class="example-section">
        <h3><icon-proicons-color-palette /> UI 组件示例</h3>
        <div class="example-grid">
          <!-- 按钮示例 -->
          <div class="example-card">
            <h4>按钮组件</h4>
            <div class="example-content">
              <button class="btn btn-primary">主要按钮</button>
              <button class="btn btn-secondary">次要按钮</button>
              <button class="btn btn-outline">边框按钮</button>
              <button class="btn btn-danger">危险按钮</button>
              <button class="btn btn-primary" disabled>禁用按钮</button>
            </div>
          </div>

          <!-- 输入框示例 -->
          <div class="example-card">
            <h4>输入框组件</h4>
            <div class="example-content">
              <input v-model="textInput" type="text" class="input" placeholder="普通输入框" />
              <input v-model="passwordInput" type="password" class="input" placeholder="密码输入框" />
              <input v-model="numberInput" type="number" class="input" placeholder="数字输入框" />
              <textarea v-model="textareaInput" class="input textarea" placeholder="多行文本"></textarea>
            </div>
          </div>

          <!-- 模态框示例 -->
          <div class="example-card">
            <h4>模态框组件</h4>
            <div class="example-content">
              <button class="btn btn-primary" @click="showModal = true">打开模态框</button>
              <Modal v-model:visible="showModal">
                <template #header>
                  <h3>示例模态框</h3>
                </template>
                <template #body>
                  <p>这是一个模态框示例内容。</p>
                  <p>您可以在这里放置任何内容。</p>
                </template>
                <template #footer>
                  <button class="btn btn-secondary" @click="showModal = false">关闭</button>
                  <button class="btn btn-primary" @click="handleModalConfirm">确认</button>
                </template>
              </Modal>
            </div>
          </div>

          <!-- Toast 通知示例 -->
          <div class="example-card">
            <h4>Toast 通知</h4>
            <div class="example-content">
              <button class="btn btn-primary" @click="toast.success('操作成功！')">成功通知</button>
              <button class="btn btn-danger" @click="toast.error('操作失败！')">错误通知</button>
              <button class="btn btn-secondary" @click="toast.warning('警告信息！')">警告通知</button>
              <button class="btn btn-outline" @click="toast.info('提示信息！')">信息通知</button>
            </div>
          </div>

          <!-- 加载状态示例 -->
          <div class="example-card">
            <h4>加载状态</h4>
            <div class="example-content">
              <button class="btn btn-primary" :disabled="isLoading" @click="simulateLoading">
                <span v-if="isLoading"><icon-proicons-spinner class="spinning" /> 加载中...</span>
                <span v-else>开始加载</span>
              </button>
              <div v-if="isLoading" class="loading-spinner"></div>
            </div>
          </div>

          <!-- 卡片组件示例 -->
          <div class="example-card">
            <h4>卡片组件</h4>
            <div class="example-content">
              <div class="card">
                <div class="card-header">卡片标题</div>
                <div class="card-body">
                  <p>这是卡片的内容区域。</p>
                  <p>可以包含任何内容。</p>
                </div>
                <div class="card-footer">
                  <button class="btn btn-sm btn-primary">操作</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tauri API 示例 -->
      <section class="example-section">
        <h3><icon-proicons-code /> Tauri API 示例</h3>
        <div class="example-grid">
          <!-- 文件选择器 -->
          <div class="example-card">
            <h4>文件选择器</h4>
            <div class="example-content">
              <button class="btn btn-primary" @click="selectFile">选择文件</button>
              <button class="btn btn-secondary" @click="selectDirectory">选择目录</button>
              <p v-if="selectedPath" class="result-text">已选择: {{ selectedPath }}</p>
            </div>
          </div>

          <!-- 文件读写 -->
          <div class="example-card">
            <h4>文件操作</h4>
            <div class="example-content">
              <input v-model="fileContent" type="text" class="input" placeholder="输入文件内容" />
              <button class="btn btn-primary" @click="saveFile">保存文件</button>
              <button class="btn btn-secondary" @click="readFile">读取文件</button>
              <p v-if="readContent" class="result-text">读取内容: {{ readContent }}</p>
            </div>
          </div>

          <!-- 系统信息 -->
          <div class="example-card">
            <h4>系统信息</h4>
            <div class="example-content">
              <button class="btn btn-primary" @click="getSystemInfo">获取系统信息</button>
              <div v-if="systemInfo" class="info-box">
                <p><strong>操作系统:</strong> {{ systemInfo?.os || '未知' }}</p>
                <p><strong>架构:</strong> {{ systemInfo?.arch || '未知' }}</p>
                <p><strong>版本:</strong> {{ systemInfo?.os_version || '未知' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 数据持久化示例 -->
      <section class="example-section">
        <h3><icon-proicons-database /> 数据持久化示例</h3>
        <div class="example-grid">
          <!-- LocalStorage -->
          <div class="example-card">
            <h4>LocalStorage</h4>
            <div class="example-content">
              <input v-model="storageValue" type="text" class="input" placeholder="输入要保存的值" />
              <button class="btn btn-primary" @click="saveToStorage">保存到 LocalStorage</button>
              <button class="btn btn-secondary" @click="loadFromStorage">从 LocalStorage 读取</button>
              <button class="btn btn-danger" @click="clearStorage">清除</button>
              <p v-if="loadedValue" class="result-text">读取的值: {{ loadedValue }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// ref 已通过 unplugin-auto-import 自动导入
// Modal 组件已通过 unplugin-vue-components 自动导入
import { api } from '@api'
import { useToast } from '@composables/useToast'
// useAppStore 已通过 unplugin-auto-import 自动导入

// 使用 composables
const toast = useToast()

// UI 组件状态
const textInput = ref('')
const passwordInput = ref('')
const numberInput = ref('')
const textareaInput = ref('')
const showModal = ref(false)
const isLoading = ref(false)

// Tauri API 状态
const selectedPath = ref('')
const fileContent = ref('')
const readContent = ref('')
const systemInfo = ref(null)

// LocalStorage 状态
const storageValue = ref('')
const loadedValue = ref('')

// UI 组件方法
const handleModalConfirm = () => {
  showModal.value = false
  toast.success('已确认！')
}

const simulateLoading = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  isLoading.value = false
  toast.success('加载完成！')
}

// Tauri API 方法
const selectFile = async () => {
  try {
    const path = await api.file.selectFile()
    if (path) {
      selectedPath.value = path
      toast.success('文件已选择')
    }
  } catch (error) {
    toast.error(`选择文件失败: ${error.message}`)
  }
}

const selectDirectory = async () => {
  try {
    const path = await api.file.selectDirectory()
    if (path) {
      selectedPath.value = path
      toast.success('目录已选择')
    }
  } catch (error) {
    toast.error(`选择目录失败: ${error.message}`)
  }
}

const saveFile = async () => {
  try {
    if (!fileContent.value) {
      toast.warning('请输入文件内容')
      return
    }
    await api.file.saveTextFile(fileContent.value)
    toast.success('文件已保存')
  } catch (error) {
    toast.error(`保存文件失败: ${error.message}`)
  }
}

const readFile = async () => {
  try {
    if (!selectedPath.value) {
      toast.warning('请先选择文件')
      return
    }
    const content = await api.system.readFile(selectedPath.value)
    readContent.value = content
    toast.success('文件已读取')
  } catch (error) {
    toast.error(`读取文件失败: ${error.message}`)
  }
}

const getSystemInfo = async () => {
  try {
    systemInfo.value = await api.system.getSystemInfo()
    toast.success('系统信息已获取')
  } catch (error) {
    toast.error(`获取系统信息失败: ${error.message}`)
  }
}

// LocalStorage 方法
const saveToStorage = () => {
  try {
    localStorage.setItem('example-value', storageValue.value)
    toast.success('已保存到 LocalStorage')
  } catch (error) {
    toast.error(`保存失败: ${error.message}`)
  }
}

const loadFromStorage = () => {
  try {
    loadedValue.value = localStorage.getItem('example-value') || '(无数据)'
    toast.info('已从 LocalStorage 读取')
  } catch (error) {
    toast.error(`读取失败: ${error.message}`)
  }
}

const clearStorage = () => {
  try {
    localStorage.removeItem('example-value')
    loadedValue.value = ''
    storageValue.value = ''
    toast.success('已清除 LocalStorage')
  } catch (error) {
    toast.error(`清除失败: ${error.message}`)
  }
}
</script>

<style scoped>
.examples-tab-container {
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

.examples-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.example-section h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing);
  font-size: var(--font-size-lg);
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing);
}

.example-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing);
  border: 1px solid var(--border-light);
}

.example-card h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size);
}

.example-content {
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

.btn-danger {
  background: #dc2626;
  color: white;
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
  min-height: 80px;
  resize: vertical;
}

.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  font-weight: 500;
}

.card-body {
  padding: var(--spacing);
}

.card-footer {
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  text-align: right;
}

.result-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius);
  word-break: break-all;
}

.info-box {
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
}

.info-box p {
  margin: var(--spacing-xs) 0;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-light);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
