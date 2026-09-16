English | [简体中文](./README.md)


# Tauri Vue Template

A modern, production-ready desktop application template built with **Tauri 2.0**, **Vue 3**, **Pinia**, and **Rust**. This project provides a solid foundation for building cross-platform desktop applications with native performance and modern web technologies.

## ✨ Features

- 🚀 **Tauri 2.0** - Build smaller, faster, and more secure desktop applications
- ⚡ **Vue 3** - Progressive JavaScript framework with Composition API
- 📦 **Pinia** - Intuitive state management with auto-persistence
- 🛣️ **Vue Router 4** - Official router with Hash mode
- 🦀 **Rust Backend** - High-performance, memory-safe backend
- 📁 **File System Access** - Secure file operations through Tauri
- 🎨 **Modern UI** - Clean, responsive interface with CSS Variables
- 🖼️ **Icon System** - 200,000+ icon library + custom SVG icons
- 🔄 **Auto Import** - Automatic imports for Vue APIs, components, router, and icons
- 💾 **State Persistence** - Auto-persist with pinia-plugin-persistedstate
- 🛠️ **Vue DevTools** - Development environment debugging tools
- 📦 **Build Optimization** - Code splitting, size optimization, LTO
- 🤖 **CI/CD** - Automated multi-platform builds and releases
- 🔧 **Developer Friendly** - Hot reload, ESLint, Prettier, and more

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **Rust** >= 1.70.0 ([Install Rust](https://www.rust-lang.org/tools/install))
- **System Requirements**:
  - macOS: 10.13+
  - Windows: 7+
  - Linux: Various distributions supported

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tauri-vue-desktop-template.git
cd tauri-vue-desktop-template

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload and Vue DevTools
npm run dev          # Start Vite dev server (port 5173) + Vue DevTools

# Or start Tauri development mode
npm run tauri:dev    # Start Tauri application with hot reload
```

### Build

```bash
# Build frontend
npm run build

# Build desktop application
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`.

## 📦 Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vue Router 4** - Official router (Hash mode)
- **Pinia** - State management
- **pinia-plugin-persistedstate** - State persistence plugin
- **Vite 7** - Next generation frontend tooling
- **unplugin-auto-import** - Automatic API imports
- **unplugin-vue-components** - Automatic component imports
- **unplugin-icons** - Automatic icon imports
- **@iconify/json** - 200,000+ icon library
- **Vue DevTools** - Development debugging tools
- **CSS Variables** - Modern styling approach

### Backend
- **Rust** - Systems programming language
- **Tauri 2.0** - Desktop application framework
- **tauri-plugin-fs** - File system operations
- **tauri-plugin-dialog** - Native dialogs
- **serde** - Serialization framework
- **SystemService** - System service module (file operations, system info)
- **Commands** - Tauri command module (frontend-backend communication)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD automation

## 🏗️ Project Structure

```
tauri-vue-template/
├── .github/
│   └── workflows/               # GitHub Actions CI/CD
│       ├── release.yml          # Multi-platform release
│       ├── test-build.yml       # Build testing
│       └── lint.yml             # Code quality checks
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── main.rs              # Application entry point
│   │   ├── lib.rs               # Library entry and command registration
│   │   ├── system.rs            # System service implementation
│   │   └── commands/            # Tauri command modules
│   │       ├── mod.rs           # Command module exports
│   │       └── system.rs        # System commands
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── src/                         # Vue frontend
│   ├── main.js                  # Vue entry point
│   ├── App.vue                  # Root component
│   ├── components/              # Vue components
│   │   ├── common/              # Reusable components
│   │   ├── PopupTab.vue
│   │   ├── ExamplesTab.vue
│   │   ├── ToolsTab.vue
│   │   └── ConfigTab.vue
│   ├── stores/                  # Pinia stores
│   │   ├── app.js               # App state
│   │   └── settings.js          # Settings state
│   ├── composables/             # Vue composables
│   ├── api/                     # API layer
│   ├── utils/                   # Utility functions
│   ├── config/                  # Configuration
│   └── assets/                  # Static assets
├── auto-imports.d.js            # Auto-generated imports (git ignored)
├── components.d.js              # Auto-generated components (git ignored)
├── package.json                 # Node dependencies
├── vite.config.js               # Vite configuration
├── eslint.config.cjs            # ESLint configuration
├── .prettierrc.json             # Prettier configuration
├── .editorconfig                # Editor configuration
├── CHANGES.md                   # Changelog
├── CODE_SIGNING.md              # Code signing guide
└── README.md                    # This file
```

## 🔧 Configuration

### Auto Import

The project uses `unplugin-auto-import` to automatically import Vue and Pinia APIs. You don't need to manually import:

```javascript
// ❌ No need to import these anymore
// import { ref, computed, watch } from 'vue'
// import { defineStore } from 'pinia'

// ✅ Just use them directly
const count = ref(0)
const doubled = computed(() => count.value * 2)
```

Configured imports include:
- Vue APIs (ref, computed, watch, onMounted, etc.)
- Pinia APIs (defineStore, storeToRefs, etc.)
- Vue Router APIs (useRouter, useRoute, etc.)
- Custom stores (useAppStore, useSettingsStore)
- Components (all .vue components in src/components)
- Icons (all Iconify icon sets + custom SVG icons)

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Application name and identifier
- Window size and behavior
- Build targets (DMG, MSI, AppImage, etc.)
- Permissions and capabilities

### Code Signing

For production releases with code signing, see [CODE_SIGNING.md](CODE_SIGNING.md) for detailed instructions on:
- macOS code signing and notarization
- Windows code signing
- Configuring GitHub Secrets

## 📚 API Documentation

### Tauri Commands

The application includes pre-built Tauri commands:

#### File Operations
```javascript
import { api } from '@api'

// Select single file
const filePath = await api.file.selectFile()

// Select multiple files
const filePaths = await api.file.selectMultipleFiles()

// Select directory
const dirPath = await api.file.selectDirectory()

// Save text file (with save dialog)
const savedPath = await api.file.saveTextFile('File content', 'filename.txt')
```

#### System Operations
```javascript
// Get application version
const version = await api.app.getVersion()

// Get data directory
const dataDir = await api.app.getDataDir()

// Read file
const content = await api.system.readFile(filePath)

// Write file
await api.system.writeFile(filePath, content)

// Check if file exists
const exists = await api.system.fileExists(filePath)

// Get system information
const sysInfo = await api.system.getSystemInfo()
```

### Icon System

The application integrates a powerful icon system with 200,000+ icons:

#### Using Iconify Icons
```vue
<template>
  <!-- Use directly, no imports needed -->
  <icon-proicons-home />
  <icon-carbon-settings />
  <icon-heroicons-bell-solid />
</template>
```

#### Using Custom SVG Icons
```vue
<template>
  <!-- Place SVG files in src/assets/icons/ -->
  <icon-custom-logo />
  <icon-custom-tauri />
  <icon-custom-vue />
</template>
```

**Detailed Documentation:**
- 📖 [Icon Usage Guide](ICONS.md) - Complete icon documentation
- 🎨 [Custom Icon Guide](CUSTOM_ICONS_GUIDE.md) - How to add custom SVG icons

### State Management

The application uses Pinia for state management with two main stores:

#### App Store
```javascript
// Auto-imported, no need to import manually
const appStore = useAppStore()

// Access state
console.log(appStore.version)
console.log(appStore.dataDir)

// Call actions
await appStore.initialize()
```

#### Settings Store
```javascript
// Auto-imported, no need to import manually
const settingsStore = useSettingsStore()

// Access state
console.log(settingsStore.language)
console.log(settingsStore.autoUpdate)

// Call actions
settingsStore.setLanguage('en-US')
settingsStore.saveSettings()
```

## 🛠️ Development Guide

### Adding New Tauri Commands

1. Create command in `src-tauri/src/main.rs`:
```rust
#[tauri::command]
fn your_command(param: String) -> Result<String, String> {
    // Your logic here
    Ok("Success".to_string())
}
```

2. Register in the invoke handler:
```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            your_command,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. Call from frontend:
```javascript
import { invoke } from '@tauri-apps/api/core'

const result = await invoke('your_command', { param: 'value' })
```

### Creating New Components

Components are automatically imported, no need to register them:

```vue
<!-- src/components/MyComponent.vue -->
<template>
  <div>{{ message }}</div>
</template>

<script setup>
// ref is auto-imported
const message = ref('Hello World')
</script>
```

Use it directly in other components:
```vue
<template>
  <MyComponent />  <!-- No import needed! -->
</template>
```

### Adding Custom Icons

1. Place SVG files in `src/assets/icons/` directory
2. Use in components with `<icon-custom-filename />`
3. No imports or configuration needed

For detailed steps, see [Custom Icon Guide](CUSTOM_ICONS_GUIDE.md)

### Customizing Styles

- Global styles: `src/assets/styles/global.css`
- CSS variables are defined in the file for customizing colors, spacing, fonts, etc.

### CI/CD Workflows

The project includes three GitHub Actions workflows:

1. **release.yml** - Triggered on version tags (v*.*.*), builds and publishes releases for all platforms
2. **test-build.yml** - Runs on push to main, tests the build process
3. **lint.yml** - Runs ESLint and Prettier checks on code changes

To create a release:
```bash
npm run bump  # Update version
git push && git push --tags
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing desktop framework
- [Vue.js](https://vuejs.org/) - For the progressive framework
- [Rust](https://www.rust-lang.org/) - For the powerful systems language
- [tauri-vue-template](https://github.com/Uninen/tauri-vue-template) - For inspiration and best practices

## 📞 Support

- 📖 [Changelog](CHANGES.md)
- 🔐 [Code Signing Guide](CODE_SIGNING.md)
- 🎨 [Icon Usage Guide](ICONS.md)
- 🖼️ [Custom Icon Guide](CUSTOM_ICONS_GUIDE.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/tauri-vue-template/issues)

---

**Happy Coding! 🚀**

