import { codecovVitePlugin } from '@codecov/vite-plugin'
import { cpSync, existsSync, readFileSync } from 'fs'
import { extname, join, resolve } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin, ViteDevServer } from 'vite'
import { defineConfig } from 'vite'

const monacoMfeDir = resolve(import.meta.dirname, '../monaco-mfe/dist')

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
}

function serveMonacoMfe(): Plugin {
  return {
    name: 'serve-monaco-mfe',
    resolveId(id: string) {
      if (id === '/monaco-mfe/index.js') {
        return { id, external: true }
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/monaco-mfe', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const urlPath = (req.url || '/index.js').split('?')[0]
        const filePath = join(monacoMfeDir, urlPath)
        if (existsSync(filePath)) {
          const content = readFileSync(filePath)
          const contentType = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream'
          res.setHeader('Content-Type', contentType)
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(content)
          return
        }
        next()
      })
    },
    closeBundle() {
      const destDir = resolve(import.meta.dirname, 'dist/monaco-mfe')
      if (existsSync(monacoMfeDir)) {
        cpSync(monacoMfeDir, destDir, { recursive: true })
      }
    },
  }
}

// https://vitejs.dev/config/

export default defineConfig(async () => {
  return {
    plugins: [
      serveMonacoMfe(),
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'shades-showcase-app',
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ],
    server: {
      host: true,
    },
    build: {
      rolldownOptions: {
        external: ['vitest', '/monaco-mfe/index.js'],
      },
    },
  }
})
