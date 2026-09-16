/**
 * 客户端自动更新服务
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

/** 获取当前应用版本 */
export async function getAppVersion() {
  return invoke('get_app_version')
}

/** 检查更新 */
export async function checkForUpdate() {
  return invoke('updater_check')
}

/** 下载并安装更新 */
export async function downloadAndInstall(downloadUrl) {
  return invoke('updater_download_install', { downloadUrl })
}

/** 监听更新进度 */
export function onUpdateProgress(callback) {
  return listen('updater:progress', event => {
    callback(event.payload)
  })
}

/** 监听更新状态 */
export function onUpdateStatus(callback) {
  return listen('updater:status', event => {
    callback(event.payload)
  })
}
