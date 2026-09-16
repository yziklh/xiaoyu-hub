<template>
  <nav class="tab-navigation">
    <div class="tab-buttons">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        class="tab-btn"
        :class="{ active: isActiveRoute(tab.path) }"
        :data-label="tab.title"
        @click="navigateTo(tab.path)"
      >
        <component :is="tab.icon" class="tab-icon" />
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ROUTES, ROUTE_TITLES, ROUTE_ICONS } from '@/constants/routes'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: ROUTES.HOME, title: ROUTE_TITLES[ROUTES.HOME], icon: ROUTE_ICONS[ROUTES.HOME] },
  { path: ROUTES.DEVICE, title: ROUTE_TITLES[ROUTES.DEVICE], icon: ROUTE_ICONS[ROUTES.DEVICE] },
  { path: ROUTES.CONFIG, title: ROUTE_TITLES[ROUTES.CONFIG], icon: ROUTE_ICONS[ROUTES.CONFIG] },
]

const isActiveRoute = path => route.path === path

const navigateTo = path => {
  router.push(path)
}
</script>

<style scoped>
.tab-navigation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  overflow: visible;
  flex-shrink: 0;
  width: 44px;
  height: 100vh;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-left: -4px;
}

.tab-navigation::-webkit-scrollbar {
  display: none;
}

.tab-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 2px solid transparent;
  box-sizing: border-box;
  position: relative;
  flex-shrink: 0;
  text-align: center;
  border-radius: 4px;
}

.tab-btn::before {
  content: attr(data-label);
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-dark);
  color: var(--text-light);
  padding: 6px 8px;
  border-radius: 6px;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow: var(--shadow-md);
  margin-right: 8px;
  z-index: var(--z-tooltip);
}

.tab-btn:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(-4px);
}

.tab-btn:hover {
  background: var(--bg-secondary);
  color: var(--primary-hover);
  transform: scale(1.05);
}

.tab-btn:hover .tab-icon {
  transform: scale(1.2, 1.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn.active {
  background: var(--bg-accent);
  border-left-color: var(--primary-color);
  color: var(--primary-dark);
  box-shadow: var(--shadow-sm);
}

.tab-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  line-height: 1;
  margin-left: -1px;
}
</style>
