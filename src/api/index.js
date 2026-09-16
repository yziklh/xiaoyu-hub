// Tauri API 适配层
// 提供统一的 Tauri API 接口

import { validateFilePath, validateFileName, sanitizeInput } from '@/utils/validation'
import { createError, ERROR_CODES, handleError } from '@/utils/errorHandler'
import { logger } from '@/utils/logger'

// 获取 Tauri invoke 函数
function getTauriInvoke() {
  if (typeof window !== 'undefined' && window.__TAURI__) {
    return window.__TAURI__.core.invoke
  }
  throw new Error('Tauri is not available')
}

// API 导出
export const api = {
  // 应用信息
  app: {
    getVersion: async () => {
      const invoke = getTauriInvoke()
      return await invoke('get_app_version')
    },

    getDataDir: async () => {
      const invoke = getTauriInvoke()
      return await invoke('get_app_data_dir')
    },
  },

  // 系统操作
  system: {
    readFile: async (path) => {
      // 验证文件路径
      if (!validateFilePath(path)) {
        logger.error('Invalid file path:', path)
        throw createError(ERROR_CODES.INVALID_FILE_PATH, { path })
      }

      try {
        const invoke = getTauriInvoke()
        logger.debug('Reading file:', path)
        return await invoke('system_read_file', { path })
      } catch (error) {
        logger.error('Failed to read file:', error)
        throw handleError(error, 'readFile')
      }
    },

    writeFile: async (path, content) => {
      // 验证文件路径
      if (!validateFilePath(path)) {
        logger.error('Invalid file path:', path)
        throw createError(ERROR_CODES.INVALID_FILE_PATH, { path })
      }

      // 清理内容
      const sanitizedContent = typeof content === 'string' ? sanitizeInput(content) : content

      try {
        const invoke = getTauriInvoke()
        logger.debug('Writing file:', path)
        return await invoke('system_write_file', { path, content: sanitizedContent })
      } catch (error) {
        logger.error('Failed to write file:', error)
        throw handleError(error, 'writeFile')
      }
    },

    fileExists: async path => {
      const invoke = getTauriInvoke()
      return await invoke('system_file_exists', { path })
    },

    getSystemInfo: async () => {
      const invoke = getTauriInvoke()
      return await invoke('system_get_info')
    },
  },

  // 文件操作
  file: {
    // 选择单个文件
    selectFile: async () => {
      const { open } = window.__TAURI__.dialog
      const selected = await open({
        multiple: false,
        directory: false,
      })
      return selected
    },

    // 选择多个文件
    selectMultipleFiles: async () => {
      const { open } = window.__TAURI__.dialog
      const selected = await open({
        multiple: true,
        directory: false,
      })
      return selected || []
    },

    // 选择目录
    selectDirectory: async () => {
      const { open } = window.__TAURI__.dialog
      const selected = await open({
        multiple: false,
        directory: true,
      })
      return selected
    },

    // 保存文本文件（显示保存对话框）
    saveTextFile: async (content, defaultFileName = 'file.txt') => {
      // 验证文件名
      if (!validateFileName(defaultFileName)) {
        logger.error('Invalid file name:', defaultFileName)
        throw createError(ERROR_CODES.INVALID_FILE_NAME, { fileName: defaultFileName })
      }

      try {
        const { save } = window.__TAURI__.dialog
        const filePath = await save({
          defaultPath: defaultFileName,
        })

        if (filePath) {
          const { writeTextFile } = window.__TAURI__.fs
          logger.debug('Saving text file:', filePath)
          await writeTextFile(filePath, content)
          return filePath
        }
        return null
      } catch (error) {
        logger.error('Failed to save text file:', error)
        throw handleError(error, 'saveTextFile')
      }
    },
  },
}
