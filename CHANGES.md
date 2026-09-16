# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 自动导入功能（unplugin-auto-import 和 unplugin-vue-components）
- Vue DevTools 集成
- GitHub Actions CI/CD 工作流
  - 多平台构建和发布（macOS x64/ARM64, Windows, Linux）
  - 代码检查和格式化验证
  - 自动化构建测试
- 代码格式化配置（EditorConfig 和 Prettier）

### Changed
- 更新依赖到最新稳定版本
  - Vue 3.5.22
  - Pinia 3.0.3
  - Vite 7.1.12
  - Tauri 2.9.x
- 优化 ESLint 配置以支持自动导入
- 简化源代码（移除可自动导入的 API 导入语句）

### Removed
- 删除 scripts/ 目录（不再需要）

## [1.0.0] - 2024-11-05

### Added
- 初始版本发布
- Tauri 2.0 + Vue 3 + Pinia 架构
- 主题系统（亮色/暗色主题）
- 设置管理
- 错误处理和日志系统
- 文件系统和对话框集成
- 响应式 UI 组件

