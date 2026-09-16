<template>
  <div class="custom-titlebar" data-tauri-drag-region></div>
</template>

<script setup>
// 此组件仅提供窗口拖拽功能
// 通过 data-tauri-drag-region 属性实现
</script>

<style scoped>
/* 窗口拖拽区域 */
.custom-titlebar {
  height: 32px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
}
</style>
