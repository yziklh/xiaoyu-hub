/**
 * 日志级别
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'NONE',
}

/**
 * 日志颜色配置
 */
const LOG_COLORS = {
  DEBUG: '#6c757d',
  INFO: '#0dcaf0',
  WARN: '#ffc107',
  ERROR: '#dc3545',
}

/**
 * Logger 类
 */
class Logger {
  constructor(level = 'INFO', enableTimestamp = true) {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO
    this.enableTimestamp = enableTimestamp
    this.logs = []
    this.maxLogs = 1000 // 最多保存 1000 条日志
  }

  /**
   * 设置日志级别
   * @param {string} level - 日志级别
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = LOG_LEVELS[level]
    }
  }

  /**
   * 获取当前日志级别
   * @returns {string} 日志级别名称
   */
  getLevel() {
    return LOG_LEVEL_NAMES[this.level]
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @returns {string} 格式化后的消息
   */
  formatMessage(level, message) {
    const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}]` : ''
    return `${timestamp} [${level}] ${message}`
  }

  /**
   * 保存日志到内存
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Array} args - 额外参数
   */
  saveLog(level, message, args) {
    const log = {
      level,
      message,
      args,
      timestamp: new Date().toISOString(),
    }

    this.logs.push(log)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  /**
   * 输出日志
   * @param {string} level - 日志级别
   * @param {Function} consoleFn - console 方法
   * @param {string} message - 日志消息
   * @param {Array} args - 额外参数
   */
  log(level, consoleFn, message, ...args) {
    const levelValue = LOG_LEVELS[level]

    if (levelValue < this.level) {
      return
    }

    const formattedMessage = this.formatMessage(level, message)
    const color = LOG_COLORS[level]

    // 保存日志
    this.saveLog(level, message, args)

    // 输出到控制台
    if (args.length > 0) {
      consoleFn(`%c${formattedMessage}`, `color: ${color}`, ...args)
    } else {
      consoleFn(`%c${formattedMessage}`, `color: ${color}`)
    }
  }

  /**
   * DEBUG 级别日志
   * @param {string} message - 日志消息
   * @param {any} args - 额外参数
   */
  debug(message, ...args) {
    this.log('DEBUG', console.log, message, ...args)
  }

  /**
   * INFO 级别日志
   * @param {string} message - 日志消息
   * @param {any} args - 额外参数
   */
  info(message, ...args) {
    this.log('INFO', console.info, message, ...args)
  }

  /**
   * WARN 级别日志
   * @param {string} message - 日志消息
   * @param {any} args - 额外参数
   */
  warn(message, ...args) {
    this.log('WARN', console.warn, message, ...args)
  }

  /**
   * ERROR 级别日志
   * @param {string} message - 日志消息
   * @param {any} args - 额外参数
   */
  error(message, ...args) {
    this.log('ERROR', console.error, message, ...args)
  }

  /**
   * 获取所有日志
   * @returns {Array} 日志数组
   */
  getLogs() {
    return [...this.logs]
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 导出日志为 JSON
   * @returns {string} JSON 字符串
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 按级别过滤日志
   * @param {string} level - 日志级别
   * @returns {Array} 过滤后的日志
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * 按时间范围过滤日志
   * @param {Date} startTime - 开始时间
   * @param {Date} endTime - 结束时间
   * @returns {Array} 过滤后的日志
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime >= startTime && logTime <= endTime
    })
  }
}

/**
 * 创建默认 logger 实例
 * 开发环境使用 DEBUG 级别，生产环境使用 WARN 级别
 */
export const logger = new Logger(import.meta.env.MODE === 'production' ? 'WARN' : 'DEBUG', true)

/**
 * 导出 Logger 类供自定义使用
 */
export { Logger, LOG_LEVELS }
