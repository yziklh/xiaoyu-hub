/**
 * 加密工具
 * 处理响应数据的 AES-GCM 解密，与 fish-uniapp 保持一致
 * 使用 crypto-js 的 AES-CTR 模式实现 GCM 解密
 * （AES-GCM 的加密部分本质上就是 AES-CTR，只是计数器从2开始）
 */
import CryptoJS from 'crypto-js'
import { getApiBase } from '@/config/api'

// 加密配置缓存
let cryptoConfigCache = null
// 缓存对应的后端地址，切换地址后需重新拉取
let cryptoConfigBaseUrl = null

/**
 * 获取加密配置
 * 使用原生 fetch 避免与 broadcast.js 的循环依赖
 */
export function fetchCryptoConfig() {
  const baseUrl = getApiBase()
  if (cryptoConfigCache && cryptoConfigBaseUrl === baseUrl) {
    return Promise.resolve(cryptoConfigCache)
  }

  return fetch(`${baseUrl}/api/crypto/config`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.json())
    .then(res => {
      if (res.code === 200 && res.data) {
        cryptoConfigCache = res.data
        cryptoConfigBaseUrl = baseUrl
        return cryptoConfigCache
      }
      return { enabled: false, publicKey: '', aesKey: '' }
    })
    .catch(() => {
      console.error('[Crypto] 获取加密配置失败')
      return { enabled: false, publicKey: '', aesKey: '' }
    })
}

/**
 * 清除加密配置缓存
 */
export function clearCryptoConfigCache() {
  cryptoConfigCache = null
  cryptoConfigBaseUrl = null
}

/**
 * 判断是否是 AES 加密的响应数据
 * 格式：Base64(IV).Base64(encryptedData)
 * IV 是 12 字节，Base64 编码后为 16 个字符
 */
export function isAesEncryptedData(data) {
  if (typeof data !== 'string') {
    return false
  }
  const parts = data.split('.')
  if (parts.length !== 2) {
    return false
  }
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  if (!base64Regex.test(parts[0]) || !base64Regex.test(parts[1])) {
    return false
  }
  return parts[0].length === 16 && parts[1].length > 10
}

/**
 * AES-GCM 解密（使用 crypto-js 的 CTR 模式实现）
 *
 * @param {string} encryptedData - 格式：Base64(IV).Base64(ciphertext+tag)
 * @param {string} aesKeyBase64 - Base64 编码的 AES 密钥
 * @returns {string} 解密后的明文
 */
function aesGcmDecrypt(encryptedData, aesKeyBase64) {
  const parts = encryptedData.split('.')
  if (parts.length !== 2) {
    throw new Error('加密数据格式错误')
  }

  const iv = CryptoJS.enc.Base64.parse(parts[0])
  const data = CryptoJS.enc.Base64.parse(parts[1])
  const key = CryptoJS.enc.Base64.parse(aesKeyBase64)

  // 分离密文和 GCM 认证标签（末尾 16 字节）
  const ciphertextSigBytes = data.sigBytes - 16
  const ciphertext = data.clone()
  ciphertext.sigBytes = ciphertextSigBytes
  ciphertext.clamp()

  // GCM 加密从 J0+1 = IV || 0x00000002 开始
  const counterWords = iv.words.slice(0, 3)
  counterWords.push(2)
  const counter = CryptoJS.lib.WordArray.create(counterWords, 16)

  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext })
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: counter,
    mode: CryptoJS.mode.CTR,
    padding: CryptoJS.pad.NoPadding,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

/**
 * 解密响应数据
 * @param {string} data - 加密的响应数据
 * @returns {Promise<any>} 解密后的数据对象
 */
export async function decryptResponseData(data) {
  const config = await fetchCryptoConfig()

  if (!config.aesKey) {
    return data
  }

  try {
    const decryptedStr = aesGcmDecrypt(data, config.aesKey)
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('[Crypto] 响应解密失败', error)
    // 解密失败可能是密钥过期，清除缓存
    clearCryptoConfigCache()
    return data
  }
}
