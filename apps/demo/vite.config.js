import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@sso-auth/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@sso-auth/components': resolve(__dirname, '../../packages/components/src/define.ts'),
      '@sso-auth/embedded': resolve(__dirname, '../../packages/embedded/src/index.ts')
    }
  },
  optimizeDeps: {
    include: ['lit', '@lit/context']
  }
})
