/**
 * 后端服务地址配置
 */
import { BASE_URL } from './client.js'

export const DEFAULT_API_BASE = BASE_URL

export function getApiBase() {
  return localStorage.getItem('broadcast-api-base') || DEFAULT_API_BASE
}

export function setApiBase(url) {
  localStorage.setItem('broadcast-api-base', url.replace(/\/$/, ''))
}

export function getWsBase() {
  const httpBase = getApiBase()
  if (httpBase.startsWith('https://')) {
    return httpBase.replace('https://', 'wss://')
  }
  return httpBase.replace('http://', 'ws://')
}

export { BASE_URL }
