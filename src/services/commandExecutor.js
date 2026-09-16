/**
 * 指令执行器：TTS、弹窗、回执
 */
import { speak, stopSpeak } from '@/services/tts'
import { logger } from '@/utils/logger'

/** 弹窗回调，由 UI 层注册 */
let overlayHandler = null
/** 指令到达回调，用于 UI 展示最近指令 */
let commandListener = null

export function registerOverlayHandler(handler) {
  overlayHandler = handler
}

export function onCommandReceived(callback) {
  commandListener = callback
}

/**
 * 执行服务端下发的指令
 * @param {object} envelope 指令信封
 * @param {(ack: object) => void} sendAck 回执发送函数
 */
export async function executeCommand(envelope, sendAck) {
  const { type, requestId, data = {} } = envelope
  logger.info('收到指令:', type, requestId)
  commandListener?.(envelope)

  try {
    if (type === 'TTS') {
      stopSpeak()
      await speak(data.text, { volume: data.volume, rate: data.rate })
      sendAck(requestId, 'SUCCESS', '播报完成')
      return
    }

    if (type === 'SHOW_MESSAGE') {
      if (overlayHandler) {
        overlayHandler({
          title: data.title || '通知',
          content: data.content || '',
          duration: data.duration ?? 10,
          fullscreen: data.fullscreen !== false,
        })
      }
      sendAck(requestId, 'SUCCESS', '弹窗已展示')
      return
    }

    if (type === 'HEARTBEAT_ACK') {
      return
    }

    logger.warn('未知指令类型:', type)
    sendAck(requestId, 'FAILED', `未知指令: ${type}`)
  } catch (error) {
    logger.error('指令执行失败:', error)
    sendAck(requestId, 'FAILED', error.message || '执行失败')
  }
}
