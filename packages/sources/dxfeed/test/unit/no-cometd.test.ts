import * as fs from 'fs'
import * as path from 'path'
import * as dxLinkWs from '../../src/transport/ws'

const SRC_DIR = path.resolve(__dirname, '../../src')

const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    })
    .filter((file) => /\.(ts|json)$/.test(file))

// config/index.ts legitimately names 'cometd' in the spec's breaking-change env check
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

  it('ships the dxLink websocket transport module in its place', () => {
    expect(typeof dxLinkWs.buildDxLinkWsTransport).toBe('function')
    expect(typeof dxLinkWs.dxLinkHandshakeMessages).toBe('function')
    expect(typeof dxLinkWs.dxLinkKeepaliveMessage).toBe('function')
  })
})
