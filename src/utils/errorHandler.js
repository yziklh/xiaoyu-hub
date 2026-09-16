/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  constructor(message, code, context = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  // 文件操作错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  INVALID_FILE_PATH: 'INVALID_FILE_PATH',
  INVALID_FILE_NAME: 'INVALID_FILE_NAME',

  // 系统错误
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  COMMAND_FAILED: 'COMMAND_FAILED',

  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // 未知错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.FILE_NOT_FOUND]: '文件不存在',
  [ERROR_CODES.FILE_READ_ERROR]: '读取文件失败',
  [ERROR_CODES.FILE_WRITE_ERROR]: '写入文件失败',
  [ERROR_CODES.INVALID_FILE_PATH]: '无效的文件路径',
  [ERROR_CODES.INVALID_FILE_NAME]: '无效的文件名',
  [ERROR_CODES.SYSTEM_ERROR]: '系统错误',
  [ERROR_CODES.PERMISSION_DENIED]: '权限不足',
  [ERROR_CODES.COMMAND_FAILED]: '命令执行失败',
  [ERROR_CODES.NETWORK_ERROR]: '网络错误',
  [ERROR_CODES.TIMEOUT_ERROR]: '操作超时',
  [ERROR_CODES.VALIDATION_ERROR]: '验证失败',
  [ERROR_CODES.INVALID_INPUT]: '无效的输入',
  [ERROR_CODES.UNKNOWN_ERROR]: '未知错误',
}

/**
 * 处理错误并返回用户友好的消息
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 * @returns {Object} 包含错误信息的对象
 */
export function handleError(error, context = '') {
  // 记录错误到控制台
  console.error(`[${context}]`, error)

  // 根据错误类型返回用户友好的消息
  let userMessage = '操作失败，请重试'
  let errorCode = ERROR_CODES.UNKNOWN_ERROR

  if (error instanceof AppError) {
    userMessage = error.message
    errorCode = error.code
  } else if (error.message) {
    // 尝试从错误消息中提取有用信息
    userMessage = parseErrorMessage(error.message)
  }

  return {
    success: false,
    message: userMessage,
    code: errorCode,
    error: error,
    context: context,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 解析错误消息，提取用户友好的信息
 * @param {string} message - 原始错误消息
 * @returns {string} 用户友好的错误消息
 */
function parseErrorMessage(message) {
  // 文件相关错误
  if (message.includes('ENOENT') || message.includes('not found')) {
    return ERROR_MESSAGES[ERROR_CODES.FILE_NOT_FOUND]
  }
  if (message.includes('EACCES') || message.includes('permission denied')) {
    return ERROR_MESSAGES[ERROR_CODES.PERMISSION_DENIED]
  }
  if (message.includes('EISDIR')) {
    return '目标是一个目录，不是文件'
  }

  // 网络相关错误
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
  }
  if (message.includes('timeout')) {
    return ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR]
  }

  // 返回原始消息（如果不太长）
  if (message.length < 100) {
    return message
  }

  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
}

/**
 * 创建一个 AppError 实例
 * @param {string} code - 错误代码
 * @param {Object} context - 错误上下文
 * @returns {AppError} AppError 实例
 */
export function createError(code, context = {}) {
  const message = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
  return new AppError(message, code, context)
}

/**
 * 异步函数错误包装器
 * @param {Function} fn - 异步函数
 * @param {string} context - 错误上下文
 * @returns {Function} 包装后的函数
 */
export function asyncErrorWrapper(fn, context = '') {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw handleError(error, context)
    }
  }
}

/**
 * 判断是否为 AppError
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否为 AppError
 */
export function isAppError(error) {
  return error instanceof AppError
}
