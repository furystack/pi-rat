import { defineConfig } from 'vite'

export default defineConfig({
  base: '/monaco-mfe/',
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
