import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockStockQuotesWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const quotesWsEndpoint = 'wss://nobi.invalidquote/api/ws'
  let oldEnv: NodeJS.ProcessEnv

  const aaplUsd = {
    base: 'Equity:US:AAPL',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    process.env['QUOTES_API_ENDPOINT'] = quotesWsEndpoint
    process.env['QUOTES_API_KEY'] = 'fake-quotes-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockStockQuotesWebsocketServer(quotesWsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(aaplUsd)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes endpoint - Equity:US:AAPL/USD', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(aaplUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().data).toEqual({
        mid_price: 190.12,
        bid_price: 190.1,
        ask_price: 190.14,
      })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
