#!/usr/bin/env node
/**
 * WebSocket proxy for Tiingo failover testing.
 *
 * Forwards WS connections from the EA to a real upstream, and exposes an HTTP
 * control server to trigger artificial closes and inspect open connections.
 *
 * Usage:
 *   UPSTREAM_WS_URL=wss://api.tiingo.com PROXY_PORT=9001 CONTROL_PORT=9002 node proxy.js
 *
 * Control endpoints:
 *   GET  http://localhost:$CONTROL_PORT/status             – list open connections
 *   POST http://localhost:$CONTROL_PORT/close?code=1005    – close all connections
 *   POST http://localhost:$CONTROL_PORT/close?code=1005&path=/iex  – close by path
 */

'use strict'

const WebSocket = require('ws')
const http = require('http')
const url = require('url')

const PROXY_PORT = parseInt(process.env.PROXY_PORT || '9001', 10)
const CONTROL_PORT = parseInt(process.env.CONTROL_PORT || String(PROXY_PORT + 1), 10)
const UPSTREAM_WS_URL = process.env.UPSTREAM_WS_URL || 'wss://api.tiingo.com'

const activePairs = [] // { id, clientWs, upstreamWs, path }
let connectionCounter = 0

// ── WebSocket proxy server ────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: PROXY_PORT })
console.log(`[proxy] Listening on ws://localhost:${PROXY_PORT}`)
console.log(`[proxy] Forwarding to ${UPSTREAM_WS_URL}`)

wss.on('connection', (clientWs, req) => {
  const id = ++connectionCounter
  const path = req.url || ''
  const upstreamUrl = `${UPSTREAM_WS_URL}${path}`
  console.log(`[proxy][${id}] EA connected, opening upstream: ${upstreamUrl}`)

  const upstreamWs = new WebSocket(upstreamUrl)
  const pair = { id, clientWs, upstreamWs, path }
  activePairs.push(pair)

  // Buffer messages from EA that arrive before upstream is ready
  const pendingMessages = []

  upstreamWs.on('open', () => {
    console.log(
      `[proxy][${id}] Upstream connected — flushing ${pendingMessages.length} buffered message(s)`,
    )
    for (const msg of pendingMessages) {
      upstreamWs.send(msg.toString('utf8')) // send as text frame, not binary
    }
    pendingMessages.length = 0
  })

  upstreamWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data)
  })

  clientWs.on('message', (data) => {
    if (upstreamWs.readyState === WebSocket.OPEN) {
      upstreamWs.send(data)
    } else {
      pendingMessages.push(data)
    }
  })

  upstreamWs.on('close', (code, reason) => {
    console.log(`[proxy][${id}] Upstream closed: code=${code} reason=${reason?.toString() || ''}`)
    if (clientWs.readyState === WebSocket.OPEN) {
      // 1005/1006 cannot be sent in a close frame — terminate the TCP connection instead
      if (code === 1005 || code === 1006) {
        clientWs.terminate()
      } else {
        clientWs.close(code, reason)
      }
    }
    removePair(id)
  })

  upstreamWs.on('error', (err) => {
    console.error(`[proxy][${id}] Upstream error: ${err.message}`)
  })

  clientWs.on('close', (code, reason) => {
    console.log(`[proxy][${id}] EA closed: code=${code} reason=${reason?.toString() || ''}`)
    if (upstreamWs.readyState === WebSocket.OPEN) upstreamWs.close()
    removePair(id)
  })

  clientWs.on('error', (err) => {
    console.error(`[proxy][${id}] EA error: ${err.message}`)
  })
})

function removePair(id) {
  const idx = activePairs.findIndex((p) => p.id === id)
  if (idx !== -1) activePairs.splice(idx, 1)
}

// ── Control HTTP server ───────────────────────────────────────────────────────
const controlServer = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true)

  if (req.method === 'GET' && parsed.pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        openConnections: activePairs.length,
        connections: activePairs.map((p) => ({ id: p.id, path: p.path })),
      }),
    )
    return
  }

  if (req.method === 'POST' && parsed.pathname === '/close') {
    const code = parseInt(parsed.query.code || '1005', 10)
    const reason = parsed.query.reason || ''
    const pathFilter = parsed.query.path || null

    const targets = [...activePairs].filter((p) => !pathFilter || p.path === pathFilter)

    console.log(
      `[control] Closing ${targets.length} connection(s) with code=${code}` +
        (pathFilter ? ` path=${pathFilter}` : ''),
    )

    for (const pair of targets) {
      if (pair.clientWs.readyState === WebSocket.OPEN) {
        if (code === 1005 || code === 1006) {
          pair.clientWs.terminate()
        } else {
          pair.clientWs.close(code, reason)
        }
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ closed: targets.length, code, path: pathFilter }))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

controlServer.listen(CONTROL_PORT, () => {
  console.log(`[control] HTTP on http://localhost:${CONTROL_PORT}`)
})
