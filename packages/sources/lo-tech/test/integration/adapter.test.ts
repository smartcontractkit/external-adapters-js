import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import {
  mockFuturesWebsocketServer,
  mockMarkPriceWebsocketServer,
  mockWebsocketServer,
} from './fixtures'

describe('websocket', () => {
  let mockWsServerAsia: MockWebsocketServer | undefined
  let mockWsServerUs: MockWebsocketServer | undefined
  let mockWsServerFutures: MockWebsocketServer | undefined
  let mockWsServerMarkPrice: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  const wsEndpointAsia = 'ws://localhost:9090/asia'
  const wsEndpointUs = 'ws://localhost:9090/us'
  const wsEndpointFutures = 'ws://localhost:9090/futures'
  const wsEndpointMarkPrice = `${wsEndpoint}/binance`
  const symbolAsia = '9988-HKD:SPOT'
  const symbolUs = 'AAPL'
  const symbolFutures = 'WTI/1'
  const symbolMarkPrice = 'S|NVDA-USDT:PERP:LINEAR'
  let oldEnv: NodeJS.ProcessEnv

  const dataStockQuotesAsia = {
    base: symbolAsia,
    endpoint: 'stock_quotes',
  }

  const dataStockQuotesUs = {
    base: symbolUs,
    endpoint: 'stock_quotes',
  }

  const dataCmeFutures = {
    base: symbolFutures,
    endpoint: 'cme_futures',
  }

  const dataMarkPrice = {
    exchange: 'binance',
    base: symbolMarkPrice,
    endpoint: 'markprice',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['ASIA_WS_API_ENDPOINT'] = wsEndpointAsia
    process.env['US_WS_API_ENDPOINT'] = wsEndpointUs
    process.env['FUTURES_WS_API_ENDPOINT'] = wsEndpointFutures
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['ASIA_API_KEY'] = 'fake-api-key'
    process.env['US_API_KEY'] = 'fake-api-key'
    process.env['FUTURES_API_KEY'] = 'fake-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServerAsia = mockWebsocketServer(wsEndpointAsia, symbolAsia)
    mockWsServerUs = mockWebsocketServer(wsEndpointUs, symbolUs)
    mockWsServerFutures = mockFuturesWebsocketServer(wsEndpointFutures)
    mockWsServerMarkPrice = mockMarkPriceWebsocketServer(wsEndpointMarkPrice, symbolMarkPrice)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results

    await testAdapter.request(dataStockQuotesAsia)
    await testAdapter.request(dataStockQuotesUs)
    await testAdapter.request(dataCmeFutures)
    await testAdapter.request(dataMarkPrice)
    await testAdapter.waitForCache(4)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServerAsia?.close()
    mockWsServerUs?.close()
    mockWsServerFutures?.close()
    mockWsServerMarkPrice?.close()
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

  describe('cme_futures endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request(dataCmeFutures)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('markprice endpoint', () => {
    it('should return the top of book mid price', async () => {
      const response = await testAdapter.request(dataMarkPrice)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
