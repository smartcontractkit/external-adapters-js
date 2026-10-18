import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as fs from 'fs'
import * as path from 'path'
import * as dxLinkWs from '../../../src/transport/ws'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan round1-delete-cometd-transport proving test (spec exception
 * cometd-transport-deletion): DxFeedWebsocketTransport — the legacy cometd
 * handshake, clientId and heartbeat — is deleted, and the dxLink websocket
 * transport ships in its place. config/index.ts legitimately names 'cometd' in
 * the spec's breaking-change env check that REJECTS the legacy path, so there
 * the grep allows only the rejection string — no transport code.
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

const COMETD_CODE_PATTERNS = /DxFeedWebsocketTransport|clientId|\/meta\/(handshake|connect)|cometd/

describe('legacy cometd transport deletion (spec exception cometd-transport-deletion)', () => {
  it('leaves no cometd transport code anywhere under src/', () => {
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

  it('ships the dxLink websocket transport built on the framework WebSocketTransport in its place', () => {
    expect(typeof dxLinkWs.buildDxLinkWsTransport).toBe('function')
    expect(typeof dxLinkWs.dxLinkHandshakeMessages).toBe('function')
    expect(typeof dxLinkWs.dxLinkKeepaliveMessage).toBe('function')
  })
})
