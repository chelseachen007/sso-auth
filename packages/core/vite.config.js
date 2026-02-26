import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SsoCore',
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist'
    })
  ]
})
