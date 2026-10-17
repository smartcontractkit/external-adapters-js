import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as fs from 'fs'
import * as path from 'path'
import { endpoint as priceEndpoint } from '../../../src/endpoint/price'
import { buildDxFeedHttpTransport } from '../../../src/transport/price-http'
import * as dxLinkWs from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-cometd-deletion proving test (spec exception
 * cometd-transport-deletion): the legacy cometd transport is deleted — grep
 * gate over src/ — and the REST path (price endpoint defaultTransport rest,
 * transport/price-http.ts) stays untouched (owner decision
 * rest_transport_scope=keep_untouched).
 */
const SRC_DIR = path.resolve(__dirname, '../../../src')

const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    })
    .filter((file) => /\.(ts|json)$/.test(file))

// config/index.ts legitimately names 'cometd' — in the spec's breaking-change
// env check that REJECTS the legacy path; no cometd transport code may appear
// there either (no DxFeedWebsocketTransport, no clientId, no /meta/ channels)
const COMETD_CODE_PATTERNS = /DxFeedWebsocketTransport|clientId|\/meta\/(handshake|connect)|cometd/

describe('cometd deletion grep gate (spec exception cometd-transport-deletion)', () => {
  it('no source file references cometd, clientId, or /meta/ channels', () => {
    const offenders = walk(SRC_DIR)
      .map((file) => ({ file, content: fs.readFileSync(file, 'utf8') }))
      .filter(({ file, content }) =>
        file.endsWith(path.join('config', 'index.ts'))
          ? /DxFeedWebsocketTransport|clientId|\/meta\/(handshake|connect)/.test(content)
          : COMETD_CODE_PATTERNS.test(content),
      )

    expect(offenders.map((o) => o.file)).toEqual([])
  })

  it('no cometd-only dependency remains in package.json', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    const cometdDeps = Object.keys(allDeps).filter((dep) => /cometd/i.test(dep))
    expect(cometdDeps).toEqual([])
  })

  it('ships the dxLink websocket transport in its place', () => {
    expect(typeof dxLinkWs.buildDxLinkWsTransport).toBe('function')
    expect(typeof dxLinkWs.dxLinkHandshakeMessages).toBe('function')
    expect(typeof dxLinkWs.dxLinkKeepaliveMessage).toBe('function')
  })
})

describe('REST path untouched (owner decision rest_transport_scope=keep_untouched)', () => {
  it('the price endpoint keeps defaultTransport rest with the ws|rest routes registered', () => {
    // Spec price endpoint: default_transport "rest"; overnight streams pin "ws"
    expect(priceEndpoint.defaultTransport).toBe('rest')
    expect(priceEndpoint.transportRoutes.routeNames().sort()).toEqual(['rest', 'ws'])
  })

  it('the REST HTTP transport still builds (transport/price-http.ts untouched)', () => {
    expect(typeof buildDxFeedHttpTransport).toBe('function')
    expect(buildDxFeedHttpTransport()).toBeDefined()
  })
})
