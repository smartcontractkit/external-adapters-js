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
  // Every subscribe_market_data message the mock server has received, in order
  const subscribedPairs: string[][] = []

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
  const nvdaUsd = {
    base: 'Equity:US:NVDA',
    quote: 'USD',
    endpoint: 'stock_quotes',
  }
  const fakeUsd = {
    base: 'Equity:US:FAKE',
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
    mockWsServer = mockStockQuotesWebsocketServer(quotesWsEndpoint, subscribedPairs)

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

  describe('stock_quotes endpoint - Equity:US:FAKE/USD (pair not found)', () => {
    const errorMessage = 'The requested pair does not exist, is inactive, or is suspended.'

    it('should return 502 when the provider reports the pair as not found', async () => {
      // First request subscribes, the provider answers "pair not found", and the transport
      // caches a 502 for both requireVolume variants, which this request picks up while polling.
      const response = await testAdapter.request(fakeUsd)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(errorMessage)
      expect(response.json()).toMatchSnapshot()

      expect(subscribedPairs.some((pairs) => pairs.includes('Equity:US:FAKE/USD'))).toBe(true)

      // The provider closes the connection after the error. The transport reconnects on the next
      // background cycle and resubscribes to every valid pair, leaving the invalid one out.
      await testAdapter.clock?.tickAsync(5_000)
      const resubscribe = subscribedPairs[subscribedPairs.length - 1]
      expect(resubscribe).toContain('Equity:US:AAPL/USD')
      expect(resubscribe).not.toContain('Equity:US:FAKE/USD')
    })

    it('should reject later requests with 400 before they reach the cache', async () => {
      const response = await testAdapter.request(fakeUsd)
      expect(response.statusCode).toBe(400)
      expect(response.json().error.message).toBe(errorMessage)
      expect(response.json()).toMatchSnapshot()
    })

    it('should reject the requireVolume variant with 400 as well', async () => {
      const response = await testAdapter.request(withRequireVolume(fakeUsd))
      expect(response.statusCode).toBe(400)
      expect(response.json().error.message).toBe(errorMessage)
    })

    it('should leave the invalid pair out of the next subscribe message', async () => {
      // A new pair forces a fresh subscribe_market_data, which re-sends every desired pair
      await testAdapter.request(nvdaUsd)
      // 5 valid pairs x 2 variants + the cached 502 for FAKE x 2 variants
      await testAdapter.waitForCache(12)

      const response = await testAdapter.request(nvdaUsd)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(880.45)

      const lastSubscribe = subscribedPairs[subscribedPairs.length - 1]
      expect(lastSubscribe).toContain('Equity:US:NVDA/USD')
      expect(lastSubscribe).toContain('Equity:US:AAPL/USD')
      expect(lastSubscribe).not.toContain('Equity:US:FAKE/USD')
    })
  })
})
