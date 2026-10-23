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
  const spyUsd = {
    base: 'ETF:US:SPY',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }
  const msftUsd = {
    base: 'Equity:US:MSFT',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }
  const spxUsd = {
    base: 'Index:US:SPX',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }
  const withRequireVolume = (request: typeof aaplUsd) => ({ ...request, requireVolume: true })

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

    for (const request of [aaplUsd, spyUsd, msftUsd, spxUsd]) {
      await testAdapter.request(request)
      await testAdapter.request(withRequireVolume(request))
    }
    // Every frame produces one cache entry per requireVolume variant: 4 pairs x 2
    await testAdapter.waitForCache(8)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes endpoint - Equity:US:AAPL/USD (quote frame)', () => {
    const expectedData = {
      mid_price: 190.12,
      bid_price: 190.1,
      bid_volume: 300,
      ask_price: 190.14,
      ask_volume: 200,
      last_price: 190.11,
    }

    it('should return last price as result and full quote data', async () => {
      const response = await testAdapter.request(aaplUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(190.11)
      expect(response.json().data).toEqual(expectedData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return the same quote when requireVolume is true and volumes are valid', async () => {
      const response = await testAdapter.request(withRequireVolume(aaplUsd))
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(190.11)
      expect(response.json().data).toEqual(expectedData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock_quotes endpoint - ETF:US:SPY/USD (quote frame without bid/ask)', () => {
    const expectedData = {
      mid_price: 530.25,
      bid_price: 530.25,
      bid_volume: 0,
      ask_price: 530.25,
      ask_volume: 0,
      last_price: 530.2,
    }

    it('should fall back to mid price for bid and ask', async () => {
      const response = await testAdapter.request(spyUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(530.2)
      expect(response.json().data).toEqual(expectedData)
      expect(response.json()).toMatchSnapshot()
    })

    it('should accept zero volumes when requireVolume is true', async () => {
      const response = await testAdapter.request(withRequireVolume(spyUsd))
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(530.2)
      expect(response.json().data).toEqual(expectedData)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock_quotes endpoint - Equity:US:MSFT/USD (quote frame without volumes)', () => {
    it('should return the quote with null volumes by default', async () => {
      const response = await testAdapter.request(msftUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(410.48)
      expect(response.json().data).toEqual({
        mid_price: 410.5,
        bid_price: 410.45,
        bid_volume: null,
        ask_price: 410.55,
        ask_volume: null,
        last_price: 410.48,
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when requireVolume is true', async () => {
      const response = await testAdapter.request(withRequireVolume(msftUsd))
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'Bid volume: undefined or Ask volume: undefined for Equity:US:MSFT/USD is invalid.',
      )
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stock_quotes endpoint - Index:US:SPX/USD (value frame)', () => {
    it('should use the index value for every price field', async () => {
      const response = await testAdapter.request(spxUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(5321.45)
      expect(response.json().data).toEqual({
        mid_price: 5321.45,
        bid_price: 5321.45,
        ask_price: 5321.45,
        last_price: 5321.45,
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when requireVolume is true', async () => {
      const response = await testAdapter.request(withRequireVolume(spxUsd))
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe('Index:US:SPX/USD does not support bid/ask volume')
      expect(response.json()).toMatchSnapshot()
    })
  })
})
