import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServerAsia: MockWebsocketServer | undefined
  let mockWsServerUs: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpointAsia = 'ws://localhost:9090/asia'
  const wsEndpointUs = 'ws://localhost:9090/us'
  const symbolAsia = '9988-HKD:SPOT'
  const symbolUs = 'AAPL'
  let oldEnv: NodeJS.ProcessEnv

  const dataStockQuotesAsia = {
    base: symbolAsia,
    endpoint: 'stock_quotes',
  }

  const dataStockQuotesUs = {
    base: symbolUs,
    endpoint: 'stock_quotes',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['ASIA_WS_API_ENDPOINT'] = wsEndpointAsia
    process.env['US_WS_API_ENDPOINT'] = wsEndpointUs
    process.env['ASIA_API_KEY'] = 'fake-api-key'
    process.env['US_API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerAsia = mockWebsocketServer(wsEndpointAsia, symbolAsia)
    mockWsServerUs = mockWebsocketServer(wsEndpointUs, symbolUs)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataStockQuotesAsia)
    await testAdapter.request(dataStockQuotesUs)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerAsia?.close()
    mockWsServerUs?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes endpoint', () => {
    it('should return success for Asian stock symbol', async () => {
      const response = await testAdapter.request(dataStockQuotesAsia)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for US stock symbol', async () => {
      const response = await testAdapter.request(dataStockQuotesUs)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
