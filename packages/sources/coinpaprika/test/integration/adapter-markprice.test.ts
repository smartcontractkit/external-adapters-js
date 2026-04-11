import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import process from 'process'
import { mockMarkPriceWebSocketServer } from './markprice-fixtures'

describe('markprice endpoint', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9091'
  let oldEnv: NodeJS.ProcessEnv

  const marketpriceData = {
    endpoint: 'markprice',
    exchange: 'binance',
    symbol: 'btcusdt',
    type: 'mark_price',
  }

  const topOfBookData = {
    endpoint: 'markprice',
    exchange: 'binance',
    symbol: 'btcusdt',
    type: 'top_of_book',
  }

  const topOfBookPerpsData = {
    endpoint: 'markprice',
    exchange: 'binance',
    symbol: 'btcusdt',
    type: 'top_of_book_perps',
  }

  const topOfBookSpotData = {
    endpoint: 'markprice',
    exchange: 'binance',
    symbol: 'btcusdt',
    type: 'top_of_book_spot',
  }

  const hyperliquidPerpsData = {
    endpoint: 'markprice',
    exchange: 'hyperliquid',
    symbol: 'BTC',
    type: 'top_of_book',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_MARK_PRICE_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'test-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockMarkPriceWebSocketServer(wsEndpoint)

    const adapter = (await import('../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await Promise.all([
      testAdapter.request(marketpriceData),
      testAdapter.request(topOfBookData),
      testAdapter.request(topOfBookPerpsData),
      testAdapter.request(topOfBookSpotData),
      testAdapter.request(hyperliquidPerpsData),
    ])
    await testAdapter.waitForCache(4)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('mark_price', () => {
    it('should return success with market price', async () => {
      const response = await testAdapter.request(marketpriceData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('top_of_book_perps', () => {
    it('should return success with explicit top_of_book_perps', async () => {
      const response = await testAdapter.request(topOfBookPerpsData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return same result when using legacy top_of_book alias', async () => {
      const response = await testAdapter.request(topOfBookData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('top_of_book_spot', () => {
    it('should return success with top_of_book_spot', async () => {
      const response = await testAdapter.request(topOfBookSpotData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('hyperliquid perps', () => {
    it('should return success with hyperliquid top_of_book_perps', async () => {
      const response = await testAdapter.request(hyperliquidPerpsData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
