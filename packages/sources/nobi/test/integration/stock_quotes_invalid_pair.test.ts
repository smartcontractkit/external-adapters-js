import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockStockQuotesWebsocketServer } from './fixtures'

// Separate adapter instance so the invalid pair is the only subscription on its transport.
// Nobi closes the connection after reporting an unknown pair, and also rejects (and closes on)
// a subscribe with an empty pair list, so the transport must not resubscribe with nothing left.
describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const quotesWsEndpoint = 'wss://nobi.invalidquote-only/api/ws'
  let oldEnv: NodeJS.ProcessEnv
  const subscribedPairs: string[][] = []
  let connections = 0

  const fakeUsd = {
    base: 'Equity:US:FAKE',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }
  const errorMessage = 'The requested pair does not exist, is inactive, or is suspended.'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    process.env['QUOTES_API_ENDPOINT'] = quotesWsEndpoint
    process.env['QUOTES_API_KEY'] = 'fake-quotes-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockStockQuotesWebsocketServer(quotesWsEndpoint, subscribedPairs)
    mockWsServer.on('connection', () => {
      connections++
    })

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes endpoint - invalid pair as the only subscription', () => {
    it('should return 502 from the provider error, then 400 from input validation', async () => {
      const first = await testAdapter.request(fakeUsd)
      expect(first.statusCode).toBe(502)
      expect(first.json().errorMessage).toBe(errorMessage)
      expect(subscribedPairs).toEqual([['Equity:US:FAKE/USD']])

      const second = await testAdapter.request(fakeUsd)
      expect(second.statusCode).toBe(400)
      expect(second.json().error.message).toBe(errorMessage)
    })

    it('should not resubscribe with an empty pair list after the provider disconnects', async () => {
      const connectionsAfterError = connections

      // Run the background loop through several cycles (BACKGROUND_EXECUTE_MS_WS is 1s). The
      // invalid pair is still in the subscription set, so without the guard every cycle would
      // reconnect, send `pairs: []`, get "Pairs is required" and be disconnected again.
      await testAdapter.clock?.tickAsync(10_000)

      expect(subscribedPairs).toEqual([['Equity:US:FAKE/USD']])
      // At most one reconnect after the provider closed the connection, and no further churn
      expect(connections - connectionsAfterError).toBeLessThanOrEqual(1)
    })
  })
})
