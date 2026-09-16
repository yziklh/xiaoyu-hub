<template>
  <div class="activity-panel" :class="{ fill: fill }">
    <div class="panel-head">
      <h3 class="panel-title">{{ title }}</h3>
      <span v-if="showCount && items.length" class="panel-count">共 {{ items.length }} 条</span>
    </div>

    <div v-if="displayItems.length" class="timeline-wrap" :style="scrollStyle">
      <div class="timeline">
        <div v-for="item in displayItems" :key="item.id" class="timeline-item">
          <div class="dot" :class="{ notify: !!item.senderName }"></div>
          <div class="content">
            <div class="row">
              <span class="time">{{ item.time }}</span>
              <span class="status" :class="statusClass(item.status)">{{ item.status }}</span>
            </div>
            <div class="title">{{ displayTitle(item) }}</div>
            <div v-if="item.kind === 'command'" class="sender">
              <span class="sender-label">发送人</span>
              <span class="sender-name">{{ item.senderName || '未知' }}</span>
            </div>
            <div v-if="item.content" class="desc">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty">暂无动态，等待课堂通知...</div>

    <button
      v-if="showMore && hasMore"
      class="more-btn"
      type="button"
      @click="handleMore"
    >
      查看更多（{{ items.length - limit }} 条）
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import { displayActivityTitle } from '@/utils/broadcast'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  /** 首页预览条数，0 表示不限制 */
  limit: {
    type: Number,
    default: 0,
  },
  /** 是否在容器内滚动 */
  scrollable: {
    type: Boolean,
    default: false,
  },
  /** 最大滚动区域高度 */
  maxHeight: {
    type: String,
    default: '320px',
  },
  /** 是否展示「查看更多」 */
  showMore: {
    type: Boolean,
    default: false,
  },
  /** 查看更多跳转路径 */
  moreRoute: {
    type: String,
    default: ROUTES.NOTIFICATIONS,
  },
  title: {
    type: String,
    default: '最近动态',
  },
  /** 是否占满父容器高度 */
  fill: {
    type: Boolean,
    default: false,
  },
  showCount: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

const displayItems = computed(() => {
  if (!props.limit || props.limit <= 0) return props.items
  return props.items.slice(0, props.limit)
})

const hasMore = computed(() => props.limit > 0 && props.items.length > props.limit)

const scrollStyle = computed(() => {
  if (!props.scrollable) return undefined
  return { maxHeight: props.maxHeight }
})

function displayTitle(item) {
  return displayActivityTitle(item)
}

function statusClass(status) {
  if (status === '运行正常') return 'normal'
  if (status === '执行成功') return 'success'
  return 'default'
}

function handleMore() {
  router.push(props.moreRoute)
}
</script>

<style scoped>
.activity-panel {
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
  box-shadow: 0 8px 24px rgba(15, 35, 52, 0.06);
  min-height: 0;
}

.activity-panel.fill {
  flex: 1;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.panel-count {
  font-size: 12px;
  color: #9ca3af;
}

.timeline-wrap {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.timeline-wrap::-webkit-scrollbar {
  width: 6px;
}

.timeline-wrap::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: #07c160;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(7, 193, 96, 0.12);
}

.dot.notify {
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.content {
  flex: 1;
  min-width: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.time {
  font-size: 12px;
  color: #9ca3af;
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  white-space: nowrap;
}

.status.success {
  background: #ecfdf3;
  color: #059669;
}

.status.normal {
  background: #eff6ff;
  color: #2563eb;
}

.title {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.sender {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.sender-label {
  font-size: 11px;
  color: #9ca3af;
}

.sender-name {
  font-size: 13px;
  color: #2563eb;
  font-weight: 600;
}

.desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
}

.more-btn {
  margin-top: 14px;
  width: 100%;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.more-btn:hover {
  background: #e5e7eb;
}
</style>
