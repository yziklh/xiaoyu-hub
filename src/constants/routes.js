/**
 * 路由常量
 */
import IconProiconsHome from '~icons/proicons/home'
import IconProiconsBox from '~icons/proicons/box'
import IconProiconsSettings from '~icons/proicons/settings'

export const ROUTES = {
  HOME: '/',
  DEVICE: '/device',
  NOTIFICATIONS: '/notifications',
  FILES: '/files',
  CONFIG: '/config',
}

export const ROUTE_NAMES = {
  HOME: 'Home',
  DEVICE: 'Device',
  NOTIFICATIONS: 'Notifications',
  FILES: 'Files',
  CONFIG: 'Config',
}

export const ROUTE_TITLES = {
  [ROUTES.HOME]: '教室小助手',
  [ROUTES.DEVICE]: '设备管理',
  [ROUTES.NOTIFICATIONS]: '通知中心',
  [ROUTES.FILES]: '文件与资源',
  [ROUTES.CONFIG]: '系统设置',
}

export const ROUTE_ICONS = {
  [ROUTES.HOME]: IconProiconsHome,
  [ROUTES.DEVICE]: IconProiconsBox,
  [ROUTES.CONFIG]: IconProiconsSettings,
}
