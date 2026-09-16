# 图标使用指南

本项目使用 `unplugin-icons` 作为图标解决方案，提供了 200,000+ 个高质量图标。

## 快速开始

### 1. 基本使用

图标会自动导入，无需手动 import：

```vue
<template>
  <!-- 直接使用图标组件 -->
  <icon-proicons-home />
  <icon-carbon-settings />
  <icon-heroicons-bell-solid />
</template>
```

### 2. 图标命名规则

图标组件名称格式：`icon-{collection}-{icon-name}`

- `icon-` - 固定前缀
- `{collection}` - 图标集名称（如 proicons, carbon, heroicons）
- `{icon-name}` - 图标名称（使用 kebab-case）

### 3. 自定义样式

```vue
<template>
  <!-- 使用 style 属性 -->
  <icon-proicons-home style="color: blue; font-size: 24px;" />

  <!-- 使用 class -->
  <icon-proicons-home class="custom-icon" />
</template>

<style scoped>
.custom-icon {
  color: var(--primary-color);
  width: 32px;
  height: 32px;
}
</style>
```

### 4. 动态图标

```vue
<template>
  <component :is="iconComponent" />
</template>

<script setup>
import IconProiconsHome from '~icons/proicons/home'
import IconProiconsSettings from '~icons/proicons/settings'

const iconComponent = ref(IconProiconsHome)
</script>
```

## 常用图标集

### ProIcons (proicons) - 项目主图标集
现代化设计，精确形状，包含 521 个图标

```vue
<icon-proicons-home />
<icon-proicons-person />
<icon-proicons-settings />
<icon-proicons-menu />
```

**特点**：
- 🎨 现代化设计风格
- 📐 精确的形状和描边
- 🔧 高度可定制
- 📦 MIT 许可证

**官方资源**：
- 图标浏览：https://icones.netlify.app/collection/proicons
- GitHub：https://github.com/ProCode-Software/proicons
- 文档：https://procode-software.github.io/proicons/

### Carbon Icons (carbon)
IBM 设计系统，简洁现代

```vue
<icon-carbon-home />
<icon-carbon-user />
<icon-carbon-settings />
```

### Heroicons (heroicons)
Tailwind CSS 官方图标

```vue
<icon-heroicons-home />
<icon-heroicons-user-solid />
```

## 项目中常用图标

### 导航图标
```vue
<!-- 首页 -->
<icon-proicons-home />

<!-- 组件示例 -->
<icon-proicons-box />

<!-- 系统工具 -->
<icon-proicons-wrench />

<!-- 应用设置 -->
<icon-proicons-settings />
```

### 功能图标
```vue
<!-- 主题切换 -->
<icon-proicons-brightness />      <!-- 亮色 -->
<icon-proicons-moon />            <!-- 暗色 -->
<icon-proicons-dark-theme />      <!-- 暗色主题 -->

<!-- Toast 通知 -->
<icon-proicons-checkmark-circle /> <!-- 成功 -->
<icon-proicons-cancel-circle />    <!-- 错误 -->
<icon-proicons-alert-circle />     <!-- 警告 -->
<icon-proicons-info />             <!-- 信息 -->
```

### 操作图标
```vue
<!-- 文件操作 -->
<icon-proicons-folder />
<icon-proicons-file />
<icon-proicons-arrow-download />
<icon-proicons-arrow-upload />

<!-- 编辑操作 -->
<icon-proicons-pencil />
<icon-proicons-delete />
<icon-proicons-save />
<icon-proicons-arrow-sync />

<!-- 状态图标 -->
<icon-proicons-spinner class="spinning" />
<icon-proicons-checkmark />
<icon-proicons-cancel />
```

### 系统图标
```vue
<!-- 系统信息 -->
<icon-proicons-computer />
<icon-proicons-database />
<icon-proicons-info />
<icon-proicons-code />

<!-- 页面特性 -->
<icon-proicons-bolt />           <!-- 快速轻量 -->
<icon-proicons-color-palette />  <!-- 现代化界面 -->
<icon-proicons-database />       <!-- 状态管理 -->
<icon-proicons-wrench />         <!-- 开发友好 -->

<!-- 其他 -->
<icon-proicons-box />
<icon-proicons-apps />
```

## 图标搜索

### 在线搜索工具

1. **ProIcons 官方浏览器**
   - 网址：https://icones.netlify.app/collection/proicons
   - 浏览所有 ProIcons 图标
   - 提供预览和代码示例

2. **Iconify 官方搜索**
   - 网址：https://icon-sets.iconify.design/
   - 支持搜索所有图标集
   - 提供预览和代码示例

3. **Icônes**
   - 网址：https://icones.js.org/
   - 更现代的搜索界面
   - 支持复制组件名称

### 搜索技巧

1. 使用英文关键词搜索
2. 尝试不同的同义词
3. 浏览相关图标集
4. ProIcons 图标使用描边风格，适合现代化界面

## 最佳实践

### 1. 保持一致性

在同一个项目中，尽量使用同一个图标集：

```vue
<!-- ✅ 推荐：统一使用 proicons -->
<icon-proicons-home />
<icon-proicons-settings />
<icon-proicons-person />

<!-- ❌ 不推荐：混用多个图标集 -->
<icon-proicons-home />
<icon-carbon-settings />
<icon-heroicons-user />
```

### 2. 语义化命名

使用有意义的变量名：

```vue
<script setup>
import IconSuccess from '~icons/proicons/checkmark-circle'
import IconError from '~icons/proicons/cancel-circle'
import IconWarning from '~icons/proicons/alert-circle'
</script>
```

### 3. 性能优化

图标会自动按需加载，只有使用的图标才会被打包：

```vue
<!-- 只会打包 home 和 settings 图标 -->
<icon-proicons-home />
<icon-proicons-settings />
```

### 4. 可访问性

为图标添加适当的 aria 标签：

```vue
<button aria-label="关闭">
  <icon-proicons-cancel />
</button>
```

## 动画效果

### 旋转动画

```vue
<template>
  <icon-proicons-spinner class="spinning" />
</template>

<style scoped>
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
```

### 悬停效果

```vue
<template>
  <icon-proicons-heart class="heart-icon" />
</template>

<style scoped>
.heart-icon {
  transition: all 0.3s ease;
}

.heart-icon:hover {
  color: red;
  transform: scale(1.2);
}
</style>
```

## 故障排除

### 图标不显示

1. 检查图标名称是否正确（ProIcons 使用 kebab-case）
2. 确认 Vite 配置正确
3. 重启开发服务器
4. 访问 https://icones.netlify.app/collection/proicons 确认图标名称

### 图标太大/太小

```vue
<!-- 方法 1：使用 style -->
<icon-proicons-home style="font-size: 24px;" />

<!-- 方法 2：使用 class -->
<icon-proicons-home class="icon-lg" />

<style>
.icon-lg {
  width: 24px;
  height: 24px;
}
</style>
```

### 图标颜色不对

```vue
<!-- SVG 图标使用 currentColor -->
<icon-proicons-home style="color: blue;" />

<!-- 或使用 CSS 变量 -->
<icon-proicons-home style="color: var(--primary-color);" />
```

## 自定义图标

### 添加自定义 SVG 图标

本项目支持使用自定义 SVG 图标，只需将 SVG 文件放入 `src/assets/icons` 目录即可。

#### 1. 创建 SVG 图标

将你的 SVG 图标文件放入 `src/assets/icons/` 目录：

```
src/assets/icons/
├── logo.svg          # 项目 Logo
├── tauri.svg         # Tauri 图标
├── vue.svg           # Vue 图标
└── my-icon.svg       # 你的自定义图标
```

#### 2. 使用自定义图标

```vue
<template>
  <!-- 使用格式：icon-custom-{文件名} -->
  <icon-custom-logo />
  <icon-custom-tauri />
  <icon-custom-vue />
  <icon-custom-my-icon />
</template>
```

#### 3. SVG 图标要求

**推荐的 SVG 格式**：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
  <!-- 你的图标路径 -->
  <path d="M50 10 L90 90 L10 90 Z"/>
</svg>
```

**关键要点**：
- ✅ 使用 `fill="currentColor"` 以支持颜色控制
- ✅ 设置合适的 `viewBox` 确保缩放正常
- ✅ 移除固定的 `width` 和 `height` 属性
- ✅ 简化路径，移除不必要的元素
- ❌ 避免使用内联样式（会覆盖 currentColor）

#### 4. 颜色控制

自定义图标会自动继承文本颜色：

```vue
<template>
  <!-- 使用 style -->
  <icon-custom-logo style="color: #42b883;" />

  <!-- 使用 class -->
  <icon-custom-logo class="brand-color" />
</template>

<style scoped>
.brand-color {
  color: var(--primary-color);
}
</style>
```

#### 5. 大小调整

```vue
<template>
  <!-- 方法 1：font-size -->
  <icon-custom-logo style="font-size: 48px;" />

  <!-- 方法 2：width/height -->
  <icon-custom-logo style="width: 48px; height: 48px;" />
</template>
```

### SVG 图标制作指南

#### 在线工具

1. **SVG 编辑器**
   - [Figma](https://www.figma.com/) - 专业设计工具
   - [Inkscape](https://inkscape.org/) - 免费开源
   - [SVG Editor](https://svg-edit.github.io/svgedit/) - 在线编辑器

2. **SVG 优化工具**
   - [SVGOMG](https://jakearchibald.github.io/svgomg/) - 在线优化
   - [SVGO](https://github.com/svg/svgo) - 命令行工具

#### 优化 SVG

使用 SVGOMG 优化你的 SVG：

1. 访问 https://jakearchibald.github.io/svgomg/
2. 上传你的 SVG 文件
3. 调整优化选项：
   - ✅ Remove viewBox: **关闭**
   - ✅ Remove dimensions: **开启**
   - ✅ Prettify markup: **开启**
4. 下载优化后的 SVG

#### 从图标库导出

**从 Iconify 导出自定义图标**：

1. 访问 https://icon-sets.iconify.design/
2. 搜索并选择图标
3. 点击 "SVG" 按钮
4. 复制 SVG 代码
5. 保存为 `.svg` 文件到 `src/assets/icons/`

### 项目自定义图标

本项目已包含以下自定义图标：

```vue
<!-- 项目 Logo -->
<icon-custom-logo />

<!-- Tauri 品牌图标 -->
<icon-custom-tauri />

<!-- Vue 品牌图标 -->
<icon-custom-vue />
```

### 自定义图标示例

```vue
<template>
  <div class="custom-icons-demo">
    <!-- 基本使用 -->
    <icon-custom-logo />

    <!-- 自定义颜色 -->
    <icon-custom-tauri style="color: #FFC131;" />

    <!-- 自定义大小 -->
    <icon-custom-vue style="font-size: 64px; color: #42b883;" />

    <!-- 动态图标 -->
    <component :is="currentIcon" />
  </div>
</template>

<script setup>
import IconCustomLogo from '~icons/custom/logo'
import IconCustomTauri from '~icons/custom/tauri'
import IconCustomVue from '~icons/custom/vue'

const currentIcon = ref(IconCustomLogo)
</script>
```

## 参考资源

- [ProIcons 官方网站](https://procode-software.github.io/proicons/)
- [ProIcons GitHub](https://github.com/ProCode-Software/proicons)
- [ProIcons 图标浏览器](https://icones.netlify.app/collection/proicons)
- [unplugin-icons 文档](https://github.com/unplugin/unplugin-icons)
- [Iconify 图标搜索](https://icon-sets.iconify.design/)
- [Icônes 搜索工具](https://icones.js.org/)
- [SVGOMG - SVG 优化工具](https://jakearchibald.github.io/svgomg/)
- [SVG 在线编辑器](https://svg-edit.github.io/svgedit/)

