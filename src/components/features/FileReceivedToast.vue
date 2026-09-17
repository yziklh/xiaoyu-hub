<template>
  <!-- 通过 composable 触发全局 Toast，无需模板内容 -->
  <span style="display: none"></span>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { onAgentPushAttachment } from '@/services/agentBridge'
import { useToast } from '@/composables/useToast'

const { success } = useToast()
let unlisten = null

onMounted(async () => {
  unlisten = await onAgentPushAttachment(payload => {
    const result = payload.result || {}
    const data = payload.data || {}
    if (result.saved || data.saved) {
      const name = data.fileName || '文件'
      success(`已保存 ${name}`)
    }
  })
})

onUnmounted(() => {
  unlisten?.()
})
</script>
