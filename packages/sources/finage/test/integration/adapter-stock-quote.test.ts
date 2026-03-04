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
  const dataNumber = {
    endpoint: 'stock_quotes',
    base: 'AAPL_NUMBER',
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
    await testAdapter.request(dataNumber)
    await testAdapter.request(fallBackData)
    await testAdapter.waitForCache(5)
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

    it('should return success for number messages', async () => {
      const response = await testAdapter.request(dataNumber)
      expect(response.json()).toMatchSnapshot()
    })

    it('missing a and b fields should fallback', async () => {
      const response = await testAdapter.request(fallBackData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return bid when ask is 0', async () => {
      const response = await testAdapter.request({
        base: 'NO_ASK',
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return ask when bid is 0', async () => {
      const response = await testAdapter.request({
        base: 'NO_BID',
        endpoint: 'stock_quotes',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
