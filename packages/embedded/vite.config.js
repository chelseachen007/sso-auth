import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SsoEmbedded',
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['@sso-auth/core'],
      output: {
        globals: {
          '@sso-auth/core': 'SsoCore'
        }
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist'
    })
  ]
})
