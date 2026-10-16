import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockTokenRenewalSuccess, mockTokenSuccess } from './fixtures'

// Captured before FakeTimers replaces the globals: nock resolves the renewal on
// real promise ticks, so driving this means advancing the fake clock AND
// yielding to the real event loop.
const realSetTimeout = globalThis.setTimeout
const realYield = () => new Promise<void>((resolve) => realSetTimeout(resolve, 5))

// DF-26076: a GSR session stops delivering data one hour after it opens,
// without closing the socket. The transport renews the token ahead of expiry to
// avoid that, and only tears the connection down if the renewal is refused.
// This covers the path that matters — renewal succeeds and the socket survives.
describe('token refresh', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let clock: FakeTimers.InstalledClock
  let oldEnv: NodeJS.ProcessEnv
  let connectionCount = 0
  let renewals = 0
  const wsEndpoint = 'ws://localhost:9093'
  const data = { base: 'ETH', quote: 'USD' }

  // Built per send so the provider timestamp tracks the fake clock rather than
  // sitting months in its future.
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

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = process.env['WS_USER_ID'] || 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = process.env['WS_PUBLIC_KEY'] || 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = process.env['WS_PRIVATE_KEY'] || 'test-priv-key'

    mockTokenSuccess()
    mockTokenRenewalSuccess().on('request', () => renewals++)
    mockWebSocketProvider(WebSocketClassProvider)

    mockWsServer = new MockWebsocketServer(wsEndpoint, { mock: false })
    mockWsServer.on('connection', (socket) => {
      connectionCount++
      socket.on('message', () => socket.send(tickerFrame()))
    })

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      // The fixture token is minted at this instant and expires at
      // 16:19:18.235Z, so it carries ~9.85 minutes of life against the 5 minute
      // TOKEN_REFRESH_MARGIN_MS — putting the refresh ~4.85 minutes out.
      clock: FakeTimers.install({ now: new Date('2022-05-10T16:09:27.193Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
    if (!testAdapter.clock) {
      throw new Error('fake clock required')
    }
    clock = testAdapter.clock

    await testAdapter.request(data)
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('renews the token in place without reconnecting', async () => {
    expect(connectionCount).toEqual(1)
    expect(renewals).toEqual(0)

    // Keep pushing data as the clock advances. WS_SUBSCRIPTION_UNRESPONSIVE_TTL
    // is 30s for this adapter, so silence while stepping past the refresh point
    // would trip the staleness check and reconnect — which is the very thing
    // this test needs to rule out.
    const start = clock.now
    while (renewals === 0 && clock.now - start < 10 * 60 * 1000) {
      mockWsServer?.clients().forEach((socket) => socket.send(tickerFrame()))
      await clock.tickAsync(10_000)
      await realYield()
    }

    expect(renewals).toBeGreaterThan(0)

    // A renewal that took keeps the socket. Had it been refused,
    // closeForReconnect would have opened a second connection.
    expect(connectionCount).toEqual(1)
  }, 60_000)
})
