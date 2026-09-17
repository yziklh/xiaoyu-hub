/**
 * Rust 常驻 Agent 桥接：WebSocket / TTS / 托盘事件
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getApiBase, getWsBase } from '@/config/api'

/** 同步配置并启动/重启 Rust 后台 Agent */
export async function configureAgent(options = {}) {
  // 优先使用传入值，否则读取 Rust 侧持久化配置，避免重连时覆盖用户关闭的自启
  let autoStart = options.autoStart
  if (autoStart === undefined) {
    try {
      const saved = await invoke('agent_get_config')
      autoStart = saved?.autoStart ?? true
    } catch {
      autoStart = true
    }
  }
  const config = {
    apiBaseUrl: getApiBase(),
    wsBaseUrl: getWsBase(),
    deviceId: options.deviceId || '',
    deviceToken: options.deviceToken || '',
    deviceName: options.deviceName || '教室设备',
    defaultVolume: options.defaultVolume ?? 80,
    defaultRate: options.defaultRate ?? 1.0,
    autoStart,
  }
  return invoke('agent_configure', { config })
}

/** 停止 Rust 后台 Agent */
export async function stopAgent() {
  return invoke('agent_stop')
}

/** 测试 Rust TTS */
export async function testAgentTts(text = '教室助手语音测试') {
  return invoke('agent_test_tts', { text })
}

/** 设置开机自启 */
export async function setAgentAutostart(enabled) {
  return invoke('agent_set_autostart', { enabled })
}

/** 查询开机自启状态 */
export async function isAgentAutostartEnabled() {
  return invoke('agent_is_autostart_enabled')
}

/** 监听连接状态：offline | connecting | online | reconnecting */
export function onAgentConnectionStatus(callback) {
  return listen('agent:connection_status', event => {
    callback(event.payload)
  })
}

/** 监听 Rust 下发的弹窗指令 */
export function onAgentShowMessage(callback) {
  return listen('agent:show_message', event => {
    callback(event.payload)
  })
}

/** 监听 Rust 收到的指令（用于 UI 动态刷新） */
export function onAgentCommandReceived(callback) {
  return listen('agent:command_received', event => {
    callback(event.payload)
  })
}

/** 监听附件下发结果（展示 / 保存） */
export function onAgentPushAttachment(callback) {
  return listen('agent:push_attachment', event => {
    callback(event.payload)
  })
}
