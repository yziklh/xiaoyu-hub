/**
 * 喊话/通知相关工具
 */

/** 从指令 envelope 中解析发送人昵称 */
export function resolveSenderName(envelope) {
  const data = envelope?.data || {}

  if (data.senderName) {
    return String(data.senderName).trim()
  }

  // 兼容弹窗标题「AA通知」
  const title = data.title || ''
  if (
    title.endsWith('通知') &&
    title.length > 2 &&
    !['老师通知', '系统通知', '收到课堂通知', '收到弹窗通知'].includes(title)
  ) {
    return title.slice(0, -2)
  }

  return ''
}

/** 生成动态标题：优先「AA通知」 */
export function buildNotifyTitle(senderName, fallback = '课堂通知') {
  return senderName ? `${senderName}通知` : fallback
}

/** 列表项展示标题 */
export function displayActivityTitle(item) {
  if (item?.senderName) {
    return `${item.senderName}通知`
  }
  const title = item?.title || ''
  if (title.endsWith('通知') && !title.startsWith('收到')) {
    return title
  }
  return title || '通知'
}

/** 指令状态映射为动态标签 */
export function mapCommandStatus(status) {
  if (status === 'SUCCESS' || status === 'SENT') return '执行成功'
  if (status === 'OFFLINE') return '设备离线'
  if (status === 'FAILED') return '执行失败'
  return status || '执行成功'
}
