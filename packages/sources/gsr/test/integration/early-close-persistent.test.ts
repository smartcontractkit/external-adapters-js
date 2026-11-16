import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// When GSR keeps refusing sessions, the framework reconnects about once a
// second. Requesting a fresh token for each of those reconnects would flood
// GSR's token endpoint, so token requests must be spaced out while the
// reconnects themselves carry on.
describe('token requests against a provider that keeps refusing sessions', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let connectionCount = 0
  let tokenRequests = 0
  const wsEndpoint = 'ws://localhost:9095'
  const data = { base: 'ETH', quote: 'USD' }

  const waitFor = async (predicate: () => boolean, timeoutMs = 15_000) => {
    const deadline = Date.now() + timeoutMs
    while (!predicate()) {
      if (Date.now() > deadline) {
        throw new Error('timed out waiting for the adapter to reconnect')
      }
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = process.env['WS_USER_ID'] || 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = process.env['WS_PUBLIC_KEY'] || 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = process.env['WS_PRIVATE_KEY'] || 'test-priv-key'

    nock('https://oracle.prod.gsr.io')
      .post('/v1/token')
      .reply(200, () => {
        tokenRequests += 1
        return {
          success: true,
          ts: 1652198967193000000,
          token: `fake-token-${tokenRequests}`,
          validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      })
      .persist()

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = new MockWebsocketServer(wsEndpoint, { mock: false })
    mockWsServer.on('connection', (socket) => {
      connectionCount += 1
      let closed = false
      socket.on('message', () => {
        if (!closed) {
          closed = true
          socket.close({ code: 1000, reason: 'Bye', wasClean: true })
        }
      })
    })

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    // Kick off the background loop; this request times out, as every session
    // is refused.
    await testAdapter.request(data)
  }, 30_000)

  afterAll(async () => {
    nock.cleanAll()
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    await testAdapter.api.close()
  })

  it('keeps reconnecting but requests only one token inside the interval', async () => {
    // Several refused sessions, all well inside MIN_TOKEN_REQUEST_INTERVAL_MS.
    await waitFor(() => connectionCount >= 4)

    expect(tokenRequests).toEqual(1)
  }, 30_000)
})
