const skipFormatting = require('@vue/eslint-config-prettier/skip-formatting')
const pluginVue = require('eslint-plugin-vue')
const js = require('@eslint/js')
const globals = require('globals')
const autoImportGlobals = require('./.eslintrc-auto-import.json')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,cjs,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '*.config.*',
      'src-tauri/**',
      'src/assets/iconfont/iconfont.js',
      'auto-imports.d.js',
      'components.d.js',
      '.eslintrc-auto-import.json',
    ],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    name: 'app/global-setup',
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportGlobals.globals,
      },
    },
  },

  {
    name: 'app/rules',
    rules: {
      'no-var': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'comma-dangle': ['error', 'only-multiline'],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'no-unused-vars': 'warn',
      'no-control-regex': 'off',
    },
  },

  skipFormatting,
]

