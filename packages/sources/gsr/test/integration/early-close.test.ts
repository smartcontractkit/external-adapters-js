import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// GSR accepts the WebSocket handshake and then closes a session it will not
// serve about a second later, with code 1000 and reason "Bye". Reusing the
// cached token across that close repeats the rejection until the token reaches
// its refresh margin, which can be tens of minutes. The transport must discard
// the token so the next connection mints a fresh one.
describe('early close re-authentication', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let connectionCount = 0
  let tokenRequests = 0
  let firstConnectionClosed = false
  const wsEndpoint = 'ws://localhost:9094'
  const data = { base: 'ETH', quote: 'USD' }

  const tickerFrame = () =>
    JSON.stringify({
      type: 'ticker',
      data: {
        symbol: 'ETH.USD',
        price: 1234,
        bidPrice: 1233,
        askPrice: 1235,
        ts: Date.now() * 1e6,
      },
    })

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
      .post('/v1/token', {
        apiKey: 'test-pub-key',
        userId: 'test-user-id',
        ts: /^\d+$/,
        signature: /^[0-9a-f]+$/i,
      })
      .reply(200, () => {
        tokenRequests += 1
        return {
          success: true,
          ts: 1652198967193000000,
          token: `fake-token-${tokenRequests}`,
          // Comfortably outside the 5 minute refresh margin, so a second token
          // request can only come from the early close.
          validUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      })
      .persist()

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = new MockWebsocketServer(wsEndpoint, { mock: false })
    mockWsServer.on('connection', (socket) => {
      connectionCount += 1
      if (connectionCount === 1) {
        // Refuse the first session the way GSR does: after the handshake and
        // the subscribe messages have gone out.
        socket.on('message', () => {
          if (!firstConnectionClosed) {
            firstConnectionClosed = true
            socket.close({ code: 1000, reason: 'Bye', wasClean: true })
          }
        })
      } else {
        socket.on('message', () => socket.send(tickerFrame()))
      }
    })

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    // Kick off the background loop. This request times out while the first
    // session is refused; the retry in the test is what sees recovered data.
    await testAdapter.request(data)
  }, 30_000)

  afterAll(async () => {
    nock.cleanAll()
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    await testAdapter.api.close()
  })

  it('mints a fresh token after the refused session and streams on the next connection', async () => {
    // The token is minted just before the connection opens, so wait for both.
    await waitFor(() => tokenRequests >= 2 && connectionCount >= 2)

    expect(connectionCount).toEqual(2)
    expect(tokenRequests).toEqual(2)

    let response = await testAdapter.request(data)
    const deadline = Date.now() + 10_000
    while (response.statusCode !== 200 && Date.now() < deadline) {
      response = await testAdapter.request(data)
    }
    expect(response.statusCode).toEqual(200)
    expect(response.json().result).toEqual(1234)
  }, 30_000)
})
