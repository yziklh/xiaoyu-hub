/**
 * TTS 语音播报（Web Speech API，跨平台可用）
 */

let speaking = false

/** 是否支持语音合成 */
export function isTtsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 停止当前播报 */
export function stopSpeak() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  speaking = false
}

/**
 * 播报文字
 * @param {string} text 文本
 * @param {{ volume?: number, rate?: number }} options 音量0-100、语速
 */
export function speak(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isTtsSupported()) {
      reject(new Error('当前环境不支持语音合成'))
      return
    }
    if (!text || !text.trim()) {
      resolve()
      return
    }

    const utter = new SpeechSynthesisUtterance(text.trim())
    utter.lang = 'zh-CN'
    utter.volume = Math.min(1, Math.max(0, (options.volume ?? 80) / 100))
    utter.rate = Math.min(2, Math.max(0.5, options.rate ?? 1))

    utter.onend = () => {
      speaking = false
      resolve()
    }
    utter.onerror = event => {
      speaking = false
      reject(event.error || new Error('语音播报失败'))
    }

    speaking = true
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  })
}

export function isSpeaking() {
  return speaking
}
