<template>
  <div class="custom-icon-demo">
    <h3><icon-proicons-apps /> 自定义图标演示</h3>

    <div class="demo-section">
      <h4>基本使用</h4>
      <div class="icon-grid">
        <div class="icon-item">
          <icon-custom-logo class="demo-icon" />
          <span>Logo</span>
        </div>
        <div class="icon-item">
          <icon-custom-tauri class="demo-icon" />
          <span>Tauri</span>
        </div>
        <div class="icon-item">
          <icon-custom-vue class="demo-icon" />
          <span>Vue</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h4>颜色控制</h4>
      <div class="icon-grid">
        <div class="icon-item">
          <icon-custom-logo class="demo-icon" style="color: #ff6b6b;" />
          <span>红色</span>
        </div>
        <div class="icon-item">
          <icon-custom-tauri class="demo-icon" style="color: #FFC131;" />
          <span>Tauri 金色</span>
        </div>
        <div class="icon-item">
          <icon-custom-vue class="demo-icon" style="color: #42b883;" />
          <span>Vue 绿色</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h4>大小调整</h4>
      <div class="icon-grid">
        <div class="icon-item">
          <icon-custom-logo style="font-size: 24px;" />
          <span>24px</span>
        </div>
        <div class="icon-item">
          <icon-custom-logo style="font-size: 48px;" />
          <span>48px</span>
        </div>
        <div class="icon-item">
          <icon-custom-logo style="font-size: 72px;" />
          <span>72px</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h4>动态图标</h4>
      <div class="dynamic-demo">
        <component :is="currentIcon" class="dynamic-icon" />
        <div class="button-group">
          <button @click="currentIcon = IconCustomLogo" class="btn btn-sm">
            Logo
          </button>
          <button @click="currentIcon = IconCustomTauri" class="btn btn-sm">
            Tauri
          </button>
          <button @click="currentIcon = IconCustomVue" class="btn btn-sm">
            Vue
          </button>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h4>使用代码</h4>
      <div class="code-block">
        <pre><code>&lt;template&gt;
  &lt;!-- 基本使用 --&gt;
  &lt;icon-custom-logo /&gt;
  &lt;icon-custom-tauri /&gt;
  &lt;icon-custom-vue /&gt;

  &lt;!-- 自定义颜色 --&gt;
  &lt;icon-custom-logo style="color: #42b883;" /&gt;

  &lt;!-- 自定义大小 --&gt;
  &lt;icon-custom-logo style="font-size: 48px;" /&gt;

  &lt;!-- 动态图标 --&gt;
  &lt;component :is="iconComponent" /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import IconCustomLogo from '~icons/custom/logo'
const iconComponent = ref(IconCustomLogo)
&lt;/script&gt;</code></pre>
      </div>
    </div>

    <div class="info-box">
      <icon-proicons-info />
      <div>
        <strong>提示：</strong>
        将你的 SVG 图标文件放入 <code>src/assets/icons/</code> 目录，
        然后使用 <code>&lt;icon-custom-文件名 /&gt;</code> 即可使用。
        查看 <code>ICONS.md</code> 了解更多详情。
      </div>
    </div>
  </div>
</template>

<script setup>
import IconCustomLogo from '~icons/custom/logo'
import IconCustomTauri from '~icons/custom/tauri'
import IconCustomVue from '~icons/custom/vue'

const currentIcon = ref(IconCustomLogo)
</script>

<style scoped>
.custom-icon-demo {
  padding: var(--spacing-md);
}

.custom-icon-demo h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.demo-section {
  margin-bottom: var(--spacing-xl);
}

.demo-section h4 {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  font-weight: 500;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-lg);
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.icon-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.demo-icon {
  font-size: 48px;
  transition: all var(--transition-normal);
}

.icon-item:hover .demo-icon {
  transform: scale(1.1);
}

.icon-item span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.dynamic-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.dynamic-icon {
  font-size: 96px;
  color: var(--primary-color);
  transition: all var(--transition-slow);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
}

.code-block {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-primary);
}

.code-block code {
  background: transparent;
  padding: 0;
}

.info-box {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--info-bg);
  border-left: 4px solid var(--info-color);
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-xl);
}

.info-box svg {
  flex-shrink: 0;
  font-size: var(--font-size-xl);
  color: var(--info-color);
}

.info-box code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
</style>

