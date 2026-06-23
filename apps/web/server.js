const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')
const { liveSessionReducer, createInitialState } = require('./lib/state-machine-cjs')

const dev = process.argv[2] === 'dev' || process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev })
const handle = app.getRequestHandler()

// In-memory sessions: sessionId -> { state, clients }
const sessions = new Map()

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { state: createInitialState(sessionId, sessionId, 'site-1'), clients: new Set() })
  }
  return sessions.get(sessionId)
}

function broadcast(session, message) {
  const data = JSON.stringify(message)
  for (const client of session.clients) {
    if (client.readyState === 1) client.send(data)
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true))
  })

  // CRITICAL: Only handle upgrades on /ws/* — let everything else (Next.js HMR) pass through
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const pathname = parse(req.url).pathname
    if (!pathname.startsWith('/ws/session/')) {
      // Not our WebSocket — destroy cleanly so Next.js HMR isn't broken
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws, req) => {
    const pathname = parse(req.url).pathname
    const match = pathname.match(/^\/ws\/session\/(.+)$/)
    if (!match) { ws.close(); return }

    const sessionId = match[1]
    const session = getOrCreateSession(sessionId)
    session.clients.add(ws)
    console.log(`[WS] +client session=${sessionId} total=${session.clients.size}`)

    ws.send(JSON.stringify({ type: 'STATE_SYNC', payload: session.state }))

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'ACTION') {
          session.state = liveSessionReducer(session.state, msg.payload)
          broadcast(session, { type: 'STATE_SYNC', payload: session.state })
        }
      } catch (e) { console.error('[WS] parse error', e.message) }
    })

    ws.on('close', () => {
      session.clients.delete(ws)
      console.log(`[WS] -client session=${sessionId} total=${session.clients.size}`)
    })

    ws.on('error', () => {})
  })

  server.listen(port, () => {
    // Get network IP for Chromebook Crostini (localhost doesn't work in Chrome)
    const { networkInterfaces } = require('os')
    const nets = networkInterfaces()
    let networkIP = 'localhost'
    for (const ifaces of Object.values(nets)) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          networkIP = iface.address
          break
        }
      }
      if (networkIP !== 'localhost') break
    }
    console.log(`\n✝ ChurchOS`)
    console.log(`  Local:    http://localhost:${port}/dashboard`)
    console.log(`  Network:  http://${networkIP}:${port}/dashboard  ← use this in Chrome on Chromebook`)
    console.log(`  Output:   http://${networkIP}:${port}/output/session-svc-1`)
    console.log(`  Seed DB:  curl -X DELETE http://${networkIP}:${port}/api/reset\n`)
    console.log(`  Mode: ${dev ? 'development' : 'production'}\n`)
  })
})
