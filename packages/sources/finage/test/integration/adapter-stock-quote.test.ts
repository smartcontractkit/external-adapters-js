import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockStockQuotesWebSocketServer } from './fixtures'

describe('stock quotes websocket', () => {
  let mockWsServerStockQuotes: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpointStockQuotes = 'ws://localhost:9094'
  let oldEnv: NodeJS.ProcessEnv
  const data = {
    endpoint: 'stock_quotes',
    base: 'AAPL',
  }
  const fallBackData = {
    endpoint: 'stock_quotes',
    base: 'FALLBACK',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['STOCK_QUOTES_WS_API_ENDPOINT'] = wsEndpointStockQuotes
    process.env['WS_SOCKET_KEY'] = 'fake-api-key'
    process.env['API_KEY'] = 'fake-api-key'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerStockQuotes = mockStockQuotesWebSocketServer(wsEndpointStockQuotes)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(data)
    await testAdapter.request(fallBackData)
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerStockQuotes?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock quotes endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
    })

    it('missing a and b fields should fallback', async () => {
      const response = await testAdapter.request(fallBackData)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
