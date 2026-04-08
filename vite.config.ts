import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function dataApiMiddleware(req: any, res: any, next: any) {
  const url: string = req.url ?? ''
  if (!url.startsWith('/api/datasets')) return next()

  // GET /api/datasets — list all
  if (req.method === 'GET' && url === '/api/datasets') {
    ensureDataDir()
    const files = fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const stat = fs.statSync(path.join(DATA_DIR, f))
        return { name: f.slice(0, -5), lastModified: stat.mtimeMs }
      })
      .sort((a, b) => b.lastModified - a.lastModified)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(files))
    return
  }

  const match = url.match(/^\/api\/datasets\/([^?]+)/)
  if (match) {
    // Sanitise: no path traversal
    const name = decodeURIComponent(match[1]).replace(/[/\\<>:"|?*]/g, '_')
    const filePath = path.join(DATA_DIR, `${name}.json`)

    if (req.method === 'GET') {
      if (!fs.existsSync(filePath)) { res.statusCode = 404; res.end(); return }
      res.setHeader('Content-Type', 'application/json')
      res.end(fs.readFileSync(filePath, 'utf8'))
      return
    }

    if (req.method === 'PUT') {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })
      req.on('end', () => {
        try {
          JSON.parse(body)
          ensureDataDir()
          fs.writeFileSync(filePath, body, 'utf8')
          res.statusCode = 204
          res.end()
        } catch {
          res.statusCode = 400; res.end('Bad JSON')
        }
      })
      return
    }

    if (req.method === 'DELETE') {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      res.statusCode = 204
      res.end()
      return
    }
  }

  next()
}

export default defineConfig({
  // GitHub Pages serves from /BudgetEqualizer/ — only applied in CI builds
  base: process.env.CI ? '/BudgetEqualizer/' : '/',
  plugins: [
    react(),
    {
      name: 'data-api',
      configureServer(server) {
        server.middlewares.use(dataApiMiddleware)
      },
      configurePreviewServer(server) {
        server.middlewares.use(dataApiMiddleware)
      },
    },
  ],
})
