import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        define: resolve(__dirname, 'src/define.ts')
      },
      name: 'SsoComponents',
      formats: ['es']
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js', '@lit/context', '@sso-auth/core'],
      output: {
        globals: {
          lit: 'Lit',
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
