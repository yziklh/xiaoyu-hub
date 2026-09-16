import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import vueDevTools from 'vite-plugin-vue-devtools'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // 仅在开发环境加载 Vue DevTools
    mode === 'development' && vueDevTools(),
    AutoImport({
      imports: [
        'vue',
        'pinia',
        'vue-router',
        {
          '@/stores': ['useAppStore', 'useSettingsStore'],
        },
      ],
      dts: 'auto-imports.d.js',
      vueTemplate: true,
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
      },
    }),
    Components({
      dts: 'components.d.js',
      dirs: [
        'src/components/common',
        'src/components/layout',
        'src/components/features',
      ],
      extensions: ['vue'],
      deep: true,
      directoryAsNamespace: false,
      resolvers: [
        IconsResolver({
          prefix: 'icon',
        }),
      ],
    }),
    Icons({
      autoInstall: true,
      compiler: 'vue3',
      customCollections: {
        // 自定义图标集：从 src/assets/icons 目录加载 SVG 文件
        custom: FileSystemIconLoader(
          './src/assets/icons',
          // 自动为 SVG 添加 currentColor 以支持颜色控制
          svg => svg.replace(/^<svg /, '<svg fill="currentColor" ')
        ),
      },
    }),
  ].filter(Boolean),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'esnext',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia', 'vue-router'],
          'tauri-vendor': ['@tauri-apps/api'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@layout': path.resolve(__dirname, 'src/components/layout'),
      '@features': path.resolve(__dirname, 'src/components/features'),
      '@common': path.resolve(__dirname, 'src/components/common'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@composables': path.resolve(__dirname, 'src/composables'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@config': path.resolve(__dirname, 'src/config'),
    }
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  optimizeDeps: {
    include: ['vue', 'pinia']
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_']
}))
