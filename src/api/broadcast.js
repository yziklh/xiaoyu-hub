/**
 * 设备端 HTTP 接口
 */
import { getApiBase } from '@/config/api'
import { isAesEncryptedData, decryptResponseData } from '@/utils/crypto'

async function request(path, options = {}) {
  const base = getApiBase()
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json()
  if (data.code !== 200 && data.code !== 0) {
    throw new Error(data.message || data.msg || '请求失败')
  }

  // 后端开启接口加密时，自动解密响应 data
  let result = data.data
  if (isAesEncryptedData(result)) {
    result = await decryptResponseData(result)
  }
  return result
}

/** 申请绑定码 */
export function createBindCode(deviceId, deviceName) {
  return request('/api/device/bind-code', {
    method: 'POST',
    body: JSON.stringify({ deviceId, deviceName }),
  })
}

/** 查询绑定状态 */
export function getBindStatus(deviceId) {
  return request(`/api/device/bind-status?deviceId=${encodeURIComponent(deviceId)}`)
}

/** 按绑定码查询绑定状态（重新绑定时等待 Token 刷新） */
export function getBindStatusByCode(bindCode) {
  return request(`/api/device/bind-status-by-code?bindCode=${encodeURIComponent(bindCode)}`)
}

/** 最近指令（含发送人） */
export function getRecentCommands(deviceId, deviceToken, limit = 20) {
  const params = new URLSearchParams({
    deviceId,
    deviceToken,
    limit: String(limit),
  })
  return request(`/api/device/recent-commands?${params.toString()}`)
}

/** 检查更新 */
export function checkUpdate(version, platform = 'windows') {
  return request(`/api/device/check-update?version=${encodeURIComponent(version || '')}&platform=${platform}`)
}
