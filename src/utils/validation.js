/**
 * 验证文件路径是否安全
 * @param {string} path - 文件路径
 * @returns {boolean} 是否为安全路径
 */
export function validateFilePath(path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // 防止路径遍历攻击
  if (path.includes('..')) {
    return false
  }

  // 防止访问系统敏感目录
  const forbiddenPaths = [
    '/etc',
    '/sys',
    '/proc',
    '/root',
    'C:\\Windows\\System32',
    'C:\\Windows\\SysWOW64',
    '/System',
    '/Library/System',
  ]

  const normalizedPath = path.toLowerCase()
  if (forbiddenPaths.some(forbidden => normalizedPath.startsWith(forbidden.toLowerCase()))) {
    return false
  }

  return true
}

/**
 * 清理用户输入，移除潜在的危险字符
 * @param {string} input - 用户输入
 * @returns {string} 清理后的字符串
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return ''
  }

  // 移除潜在的危险字符
  return input
    .replace(/[<>]/g, '') // 移除 HTML 标签字符
    .replace(/['"]/g, '') // 移除引号
    .trim()
}

/**
 * 验证文件名是否合法
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为合法文件名
 */
export function validateFileName(filename) {
  if (!filename || typeof filename !== 'string') {
    return false
  }

  // 检查文件名长度
  if (filename.length > 255) {
    return false
  }

  // 检查非法字符
  const illegalChars = /[<>:"/\\|?*\x00-\x1f]/g
  if (illegalChars.test(filename)) {
    return false
  }

  // 检查保留名称（Windows）
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
  if (reservedNames.test(filename)) {
    return false
  }

  return true
}


