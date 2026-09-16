import { createRouter, createWebHashHistory } from 'vue-router'
import { ROUTES, ROUTE_NAMES, ROUTE_TITLES, ROUTE_ICONS } from '@/constants/routes'

const routes = [
  {
    path: ROUTES.HOME,
    name: ROUTE_NAMES.HOME,
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: ROUTE_TITLES[ROUTES.HOME],
      icon: ROUTE_ICONS[ROUTES.HOME],
    },
  },
  {
    path: ROUTES.DEVICE,
    name: ROUTE_NAMES.DEVICE,
    component: () => import('@/views/DeviceView.vue'),
    meta: {
      title: ROUTE_TITLES[ROUTES.DEVICE],
      icon: ROUTE_ICONS[ROUTES.DEVICE],
    },
  },
  {
    path: ROUTES.NOTIFICATIONS,
    name: ROUTE_NAMES.NOTIFICATIONS,
    component: () => import('@/views/NotificationView.vue'),
    meta: {
      title: ROUTE_TITLES[ROUTES.NOTIFICATIONS],
    },
  },
  {
    path: ROUTES.FILES,
    name: ROUTE_NAMES.FILES,
    component: () => import('@/views/FilesView.vue'),
    meta: {
      title: ROUTE_TITLES[ROUTES.FILES],
    },
  },
  {
    path: ROUTES.CONFIG,
    name: ROUTE_NAMES.CONFIG,
    component: () => import('@/views/ConfigView.vue'),
    meta: {
      title: ROUTE_TITLES[ROUTES.CONFIG],
      icon: ROUTE_ICONS[ROUTES.CONFIG],
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 教室小助手`
  }
  next()
})

export default router
