/**
 * @deprecated WebSocket 已迁移至 Rust 常驻 Agent，请使用 agentBridge.js
 */
import {
  configureAgent,
  stopAgent,
  onAgentConnectionStatus,
} from '@/services/agentBridge'

export function onWsStatus(callback) {
  return onAgentConnectionStatus(callback)
}

export function connect(deviceToken, options = {}) {
  return configureAgent({
    deviceToken,
    ...options,
  })
}

export function disconnect() {
  return stopAgent()
}

export function getConnectionState() {
  return 'offline'
}
