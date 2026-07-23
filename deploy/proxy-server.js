const http = require('http')
const https = require('https')
const url = require('url')

const PORT = process.env.PROXY_PORT || 3001
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'

function getProtocol(target) {
  return target.startsWith('https://') ? https : http
}

function isUrlValid(target) {
  try {
    const parsed = new URL(target)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const server = http.createServer((req, res) => {
  const target = req.headers['x-api-target']
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': ALLOWED_ORIGINS })
    res.end('Missing X-API-Target header')
    return
  }

  if (!isUrlValid(target)) {
    res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': ALLOWED_ORIGINS })
    res.end('Invalid X-API-Target URL')
    return
  }

  const targetUrl = new URL(target)
  const reqUrl = new URL(req.url, `http://localhost`)
  
  const proxyPath = reqUrl.pathname.replace(/^\/api-proxy/, '') || '/'
  const fullPath = proxyPath + reqUrl.search
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: fullPath,
    method: req.method,
    headers: {},
    timeout: 600000,
  }

  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'x-api-target', 'origin', 'referer', 'connection', 'content-length'].includes(key.toLowerCase())) {
      continue
    }
    options.headers[key] = value
  }
  
  options.headers['host'] = targetUrl.hostname
  options.headers['x-forwarded-for'] = req.connection.remoteAddress
  options.headers['x-forwarded-proto'] = targetUrl.protocol.replace(':', '')

  const protocol = getProtocol(target)
  const proxyReq = protocol.request(options, (proxyRes) => {
    const headers = {}
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (['content-security-policy', 'strict-transport-security', 'public-key-pins', 'x-frame-options'].includes(key.toLowerCase())) {
        continue
      }
      headers[key] = value
    }
    headers['access-control-allow-origin'] = ALLOWED_ORIGINS
    headers['access-control-allow-credentials'] = 'true'

    res.writeHead(proxyRes.statusCode, headers)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
    res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': ALLOWED_ORIGINS })
    res.end('Proxy error: ' + err.message)
  })

  proxyReq.on('timeout', () => {
    proxyReq.destroy()
    res.writeHead(504, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': ALLOWED_ORIGINS })
    res.end('Proxy timeout')
  })

  req.pipe(proxyReq)
})

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
})

server.listen(PORT, () => {
  console.log(`API Proxy Server listening on port ${PORT}`)
})
