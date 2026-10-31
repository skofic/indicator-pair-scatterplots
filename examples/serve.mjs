// Static file server for the Phase 3 examples: serves the repository root on localhost with HTTP Range support,
// which the cloud-optimised GeoTIFFs need (OpenLayers reads them by byte ranges). No dependencies.
// Usage: node examples/serve.mjs [port]   → http://localhost:8080/examples/
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const PORT = Number(process.argv[2] ?? 8080)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.geojson': 'application/geo+json', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.png': 'image/png', '.svg': 'image/svg+xml' }

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  let path = normalize(decodeURIComponent(url.pathname))
  if (path.endsWith('/')) path += 'index.html'
  const file = join(ROOT, path)
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end() }
  let st
  try { st = statSync(file) } catch { res.writeHead(404); return res.end('not found: ' + path) }
  if (st.isDirectory()) { res.writeHead(301, { Location: url.pathname + '/' }); return res.end() }
  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' }
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/)
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 })
    return createReadStream(file, { start, end }).pipe(res)
  }
  res.writeHead(200, { ...headers, 'Content-Length': st.size })
  createReadStream(file).pipe(res)
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} at http://localhost:${PORT}/examples/`))
