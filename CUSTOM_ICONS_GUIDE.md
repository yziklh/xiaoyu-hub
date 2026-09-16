# 自定义图标快速指南

## 🎯 概述

本项目已成功配置自定义图标功能，你可以轻松添加和使用自己的 SVG 图标。

## 📁 目录结构

```
src/assets/icons/
├── logo.svg          # 项目 Logo（示例）
├── tauri.svg         # Tauri 图标（示例）
├── vue.svg           # Vue 图标（示例）
└── your-icon.svg     # 你的自定义图标
```

## 🚀 快速开始

### 1. 添加 SVG 图标

将你的 SVG 文件放入 `src/assets/icons/` 目录：

```bash
# 示例：添加一个名为 my-icon.svg 的图标
cp /path/to/my-icon.svg src/assets/icons/
```

### 2. 使用自定义图标

在 Vue 组件中直接使用：

```vue
<template>
  <!-- 使用格式：icon-custom-{文件名} -->
  <icon-custom-logo />
  <icon-custom-tauri />
  <icon-custom-vue />
  <icon-custom-my-icon />
</template>
```

**无需任何导入！** 图标会自动注册并可用。

### 3. 自定义样式

```vue
<template>
  <!-- 改变颜色 -->
  <icon-custom-logo style="color: #42b883;" />
  
  <!-- 改变大小 -->
  <icon-custom-logo style="font-size: 48px;" />
  
  <!-- 组合使用 -->
  <icon-custom-logo style="color: red; font-size: 64px;" />
</template>
```

## 📝 SVG 图标要求

### 推荐格式

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
  <path d="M50 10 L90 90 L10 90 Z"/>
</svg>
```

### 关键要点

✅ **必须包含**：
- `xmlns="http://www.w3.org/2000/svg"` 属性
- `viewBox` 属性（确保缩放正常）
- `fill="currentColor"`（支持颜色控制）

❌ **避免使用**：
- 固定的 `width` 和 `height` 属性
- 内联样式（会覆盖 currentColor）
- 过于复杂的路径（影响性能）

## 🛠️ SVG 优化工具

### 在线工具

1. **SVGOMG** - https://jakearchibald.github.io/svgomg/
   - 上传 SVG 文件
   - 自动优化并减小文件大小
   - 下载优化后的 SVG

2. **SVG Editor** - https://svg-edit.github.io/svgedit/
   - 在线编辑 SVG
   - 简化路径
   - 导出优化后的代码

### 优化步骤

1. 访问 SVGOMG
2. 上传你的 SVG 文件
3. 配置选项：
   - ✅ Remove viewBox: **关闭**
   - ✅ Remove dimensions: **开启**
   - ✅ Prettify markup: **开启**
4. 下载优化后的文件
5. 保存到 `src/assets/icons/`

## 💡 使用示例

### 基本使用

```vue
<template>
  <div class="icon-showcase">
    <icon-custom-logo />
    <icon-custom-tauri />
    <icon-custom-vue />
  </div>
</template>
```

### 动态图标

```vue
<template>
  <component :is="currentIcon" />
  <button @click="switchIcon">切换图标</button>
</template>

<script setup>
import IconCustomLogo from '~icons/custom/logo'
import IconCustomTauri from '~icons/custom/tauri'

const currentIcon = ref(IconCustomLogo)

const switchIcon = () => {
  currentIcon.value = currentIcon.value === IconCustomLogo 
    ? IconCustomTauri 
    : IconCustomLogo
}
</script>
```

### 在按钮中使用

```vue
<template>
  <button class="btn btn-primary">
    <icon-custom-logo />
    开始使用
  </button>
</template>

<style scoped>
.btn svg {
  margin-right: 8px;
}
</style>
```

## 🎨 已包含的示例图标

本项目已包含 3 个示例图标：

| 图标 | 组件名 | 用途 |
|------|--------|------|
| logo.svg | `<icon-custom-logo />` | 项目 Logo |
| tauri.svg | `<icon-custom-tauri />` | Tauri 品牌 |
| vue.svg | `<icon-custom-vue />` | Vue 品牌 |

## 📊 查看演示

启动开发服务器后，访问"组件示例"页面查看完整的自定义图标演示：

```bash
npm run dev
```

然后在应用中导航到 **组件示例** → **自定义图标演示**

## 🔧 技术细节

### Vite 配置

自定义图标通过 `unplugin-icons` 的 `FileSystemIconLoader` 实现：

```javascript
// vite.config.js
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

Icons({
  customCollections: {
    custom: FileSystemIconLoader(
      './src/assets/icons',
      svg => svg.replace(/^<svg /, '<svg fill="currentColor" ')
    ),
  },
})
```

### 自动处理

- ✅ 自动扫描 `src/assets/icons/` 目录
- ✅ 自动注册为 Vue 组件
- ✅ 自动添加 `currentColor` 支持
- ✅ 自动按需加载（Tree-shaking）

## 📚 更多资源

- [完整图标文档](./ICONS.md) - 查看所有图标使用方法
- [unplugin-icons 文档](https://github.com/unplugin/unplugin-icons)
- [SVGOMG 优化工具](https://jakearchibald.github.io/svgomg/)
- [Iconify 图标搜索](https://icon-sets.iconify.design/)

## ❓ 常见问题

### Q: 图标不显示怎么办？

1. 检查 SVG 文件是否在 `src/assets/icons/` 目录
2. 确认文件名使用 kebab-case（如 `my-icon.svg`）
3. 重启开发服务器
4. 检查浏览器控制台是否有错误

### Q: 如何改变图标颜色？

使用 `style` 或 `class` 设置 `color` 属性：

```vue
<icon-custom-logo style="color: #42b883;" />
```

### Q: 图标太大/太小怎么办？

使用 `font-size` 或 `width/height` 调整：

```vue
<icon-custom-logo style="font-size: 48px;" />
```

### Q: 可以使用 PNG/JPG 图标吗？

不可以。本系统只支持 SVG 格式。如果你有 PNG/JPG 图标，可以：
1. 使用在线工具转换为 SVG
2. 或使用 `<img>` 标签直接引用

## 🎉 开始使用

现在你已经了解了如何使用自定义图标！

1. 将你的 SVG 文件放入 `src/assets/icons/`
2. 使用 `<icon-custom-文件名 />` 即可
3. 查看演示页面了解更多用法

祝你使用愉快！ 🚀

