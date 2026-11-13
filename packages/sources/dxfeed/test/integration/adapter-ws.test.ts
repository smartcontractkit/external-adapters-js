/**
 * dxLink websocket integration tests — OPDATA-9200 spec endpoint wiring.
 *
 * Both endpoints keep working from the single dxLink connection:
 * - stock_quotes: Quote events -> mid (primary), bid/ask prices, bid/ask
 *   volumes; requireVolume errors on invalid volumes; isOvernight accepts
 *   only exchange code O on both sides
 * - price (stock alias): Trade (regular hours) / TradeETH (extended hours)
 *   -> last trade price; when both arrive, the record with the newest time
 *
 * Assertions come from the spec's endpoint_request_response_examples and
 * response_mapping, through the adapter's real request path.
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import {
  quoteFrame,
  quoteRecord,
  ScriptedDxLinkServer,
  tradeFrame,
  tradeRecord,
} from '../unit/fixtures'

const WS_URL = 'ws://localhost:9090/dxlink'

describe('dxLink websocket endpoints', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter

  // Spec example: stock_quotes request with the dxfeed override.
  const stockQuotesRequest = {
    endpoint: 'stock_quotes',
    from: 'AAPL',
    to: 'USD',
    overrides: { dxfeed: { AAPL: 'AAPL:USLF24' } },
  }
  // Spec example: price endpoint (stock alias) over the ws transport.
  const priceRequest = {
    endpoint: 'stock',
    from: 'AAPL',
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { AAPL: 'AAPL:USLF24' } },
  }
  const priceNewestEthRequest = {
    endpoint: 'stock',
    from: 'ZZZ',
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { ZZZ: 'ZZZ:USLF24' } },
  }
  const priceEthOnlyRequest = {
    endpoint: 'stock',
    from: 'AMZN',
    to: 'USD',
    transport: 'ws',
    overrides: { dxfeed: { AMZN: 'AMZN:USLF24' } },
  }
  const oxRequest = { endpoint: 'stock_quotes', base: 'OX', quote: 'USD' }
  const oxOvernightRequest = { ...oxRequest, isOvernight: true }
  const oxmixRequest = { endpoint: 'stock_quotes', base: 'OXMIX', quote: 'USD' }
  const oxmixOvernightRequest = { ...oxmixRequest, isOvernight: true }
  const noVolumeRequest = { endpoint: 'stock_quotes', base: 'NO_VOLUME', quote: 'USD' }
  const oneSideRequest = { endpoint: 'stock_quotes', base: 'ONE_SIDE', quote: 'USD' }
  const nullVolumeRequest = { endpoint: 'stock_quotes', base: 'NULL_VOLUME', quote: 'USD' }
  const nullPriceRequest = { endpoint: 'stock_quotes', base: 'NULL_PRICE', quote: 'USD' }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_API_ENDPOINT = WS_URL
    process.env.API_USERNAME = 'fake-user'
    process.env.API_PASSWORD = 'fake-pass'
    process.env.WS_SUBSCRIPTION_TTL = '60000'
    process.env.WS_SUBSCRIPTION_UNRESPONSIVE_TTL = '60000'
    process.env.CACHE_MAX_AGE = '60000'
    process.env.WS_CONNECTION_OPEN_TIMEOUT = '2000'
    process.env.WS_HEARTBEAT_INTERVAL_MS = '5000'

    server = new ScriptedDxLinkServer(WS_URL)
    // Spec stock_quotes sample_response: two COMPACT Quote records; the
    // newest is the spec example response.
    server.setFeedData('Quote', 'AAPL:USLF24', [
      quoteFrame(
        quoteRecord('AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'),
        quoteRecord('AAPL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'),
      ),
    ])
    // Trade (spec sample) + an OLDER TradeETH: newest wins -> 189.98.
    server.setFeedData('Trade', 'AAPL:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'AAPL:USLF24', 1760000000000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'AAPL:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'AAPL:USLF24', 500, 400)),
    ])
    // A NEWER TradeETH must win over the older Trade.
    server.setFeedData('Trade', 'ZZZ:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'ZZZ:USLF24', 1000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'ZZZ:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'ZZZ:USLF24', 1760000005000, 191.5)),
    ])
    // Symbol with no regular-hours session: TradeETH events only.
    server.setFeedData('TradeETH', 'AMZN:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'AMZN:USLF24', 200, 300)),
    ])
    // Exchange code O (Blue Ocean) vs V: the O record is the older one here.
    server.setFeedData('Quote', 'OX', [
      quoteFrame(
        quoteRecord('OX', 1760000001000, 170, 172, 10, 20, 'V', 'V'),
        quoteRecord('OX', 1760000000000, 160, 161, 5, 6, 'O', 'O'),
      ),
    ])
    // Mixed sides: the newest record has only ONE side on O — isOvernight
    // requires O on BOTH sides, so it must be dropped in favour of the
    // older all-O record.
    server.setFeedData('Quote', 'OXMIX', [
      quoteFrame(
        quoteRecord('OXMIX', 1760000003000, 180, 182, 7, 9, 'O', 'V'),
        quoteRecord('OXMIX', 1760000001000, 160, 161, 5, 6, 'O', 'O'),
      ),
    ])
    // Invalid ("NaN") volumes.
    server.setFeedData('Quote', 'NO_VOLUME', [
      quoteFrame(quoteRecord('NO_VOLUME', 1760000002000, 170, 172, 'NaN', 'NaN')),
    ])
    // Literal null volumes: JS Number(null) === 0 would let these masquerade
    // as legitimate zero sizes — the adapter must treat them as missing.
    server.setFeedData('Quote', 'NULL_VOLUME', [
      quoteFrame(quoteRecord('NULL_VOLUME', 1760000002000, 170, 172, null, null)),
    ])
    // Literal null prices: must hit the invalid bid/ask price path, not the
    // one-sided-zero fallback.
    server.setFeedData('Quote', 'NULL_PRICE', [
      quoteFrame(quoteRecord('NULL_PRICE', 1760000002000, 170, null, 10, null)),
    ])
    // One side missing (0): mid_price = (bidPrice + askPrice) / 2 with a
    // one-sided mid when only one side is valid (spec response_mapping).
    server.setFeedData('Quote', 'ONE_SIDE', [
      quoteFrame(quoteRecord('ONE_SIDE', 1760000002000, 170, 0, 10, 0)),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    const adapter = (await import('./../../src')).adapter
    // rateLimiting stays: undefined makes the fixed-interval period 0, which starves fake-timer ticks
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    // Framework test pattern: fire each request, then let the framework drain
    // its timer queue until the cache holds every expected entry
    // (TestAdapter.waitForCache). Each awaited request self-drains the
    // installed clock while the dxLink foreground gate waits for the
    // background stream to fill the cache.
    for (const request of [
      stockQuotesRequest,
      priceRequest,
      priceNewestEthRequest,
      priceEthOnlyRequest,
      oxRequest,
      oxOvernightRequest,
      oxmixRequest,
      oxmixOvernightRequest,
      noVolumeRequest,
      oneSideRequest,
      nullVolumeRequest,
      nullPriceRequest,
    ]) {
      await testAdapter.request(request)
    }
    await testAdapter.waitForCache(11)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  describe('stock_quotes', () => {
    it('returns the spec example response (mid primary, prices, volumes, provider time)', async () => {
      const response = await testAdapter.request(stockQuotesRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({
        bid_price: 189.9,
        bid_volume: 50,
        ask_price: 190.1,
        ask_volume: 80,
      })
      expect(body.data.mid_price).toBeCloseTo(190, 10)
      expect(body.result).toBeCloseTo(190, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000001000)
    })

    it('drops non-O quotes when isOvernight is true (exchange code O on both sides)', async () => {
      const response = await testAdapter.request(oxOvernightRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({ bid_price: 160, ask_price: 161 })
      expect(body.data.mid_price).toBeCloseTo(160.5, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)
    })

    it('serves the newest quote regardless of exchange when isOvernight is absent', async () => {
      const response = await testAdapter.request(oxRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({ bid_price: 170, ask_price: 172 })
      expect(body.data.mid_price).toBeCloseTo(171, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000001000)
    })

    it('drops a mixed-side record under isOvernight (O required on BOTH sides)', async () => {
      // The newest OXMIX record has bidExchangeCode O but askExchangeCode V:
      // it must be dropped, and the older all-O record served instead.
      const response = await testAdapter.request(oxmixOvernightRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({ bid_price: 160, ask_price: 161 })
      expect(body.data.mid_price).toBeCloseTo(160.5, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000001000)
    })

    it('serves the mixed-side record when isOvernight is absent (exchange codes unchecked)', async () => {
      const response = await testAdapter.request(oxmixRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({ bid_price: 180, ask_price: 182 })
      expect(body.data.mid_price).toBeCloseTo(181, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000003000)
    })

    it('computes a one-sided mid when only one side is valid', async () => {
      const response = await testAdapter.request(oneSideRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      // askPrice 0 (no valid ask): the incumbent's one-side-zero fallback
      // serves mid = bid, the quote itself is still served with its provider
      // time.
      expect(body.data).toMatchObject({ bid_price: 170, ask_price: 0 })
      expect(body.data.mid_price).toBeCloseTo(170, 10)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000002000)
    })

    it('tolerates invalid volumes when requireVolume is absent', async () => {
      const response = await testAdapter.request(noVolumeRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toMatchObject({ bid_price: 170, ask_price: 172 })
      expect(body.data.mid_price).toBeCloseTo(171, 10)
      expect(body.data.bid_volume || body.data.ask_volume).toBeFalsy()
    })

    it('errors on invalid volumes when requireVolume is true', async () => {
      const response = await testAdapter.request({ ...noVolumeRequest, requireVolume: true })
      expect(response.statusCode).not.toBe(200)
      const body = response.json()
      expect(body.error ?? body.errorMessage).toBeDefined()
    })

    it('treats literal null volumes as missing, not as zero size (requireVolume absent)', async () => {
      // Number(null) === 0 must not leak: the mid is still served, but the
      // volumes must not surface as legitimate 0s.
      const response = await testAdapter.request(nullVolumeRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.mid_price).toBeCloseTo(171, 10)
      expect(body.data.bid_volume || body.data.ask_volume).toBeFalsy()
    })

    it('errors on literal null volumes with the raw provider values in the message (requireVolume true)', async () => {
      const response = await testAdapter.request({ ...nullVolumeRequest, requireVolume: true })
      expect(response.statusCode).not.toBe(200)
      const body = response.json()
      // Raw value preserved: a null from dxfeed must stay distinguishable
      // from the 'NaN' string case in the 502 message.
      expect(body.error ?? body.errorMessage).toContain('Bid volume: null or Ask volume: null')
    })

    it('errors on literal null prices instead of applying the one-sided-zero fallback', async () => {
      const response = await testAdapter.request(nullPriceRequest)
      expect(response.statusCode).not.toBe(200)
      const body = response.json()
      expect(body.error ?? body.errorMessage).toContain('Bid price: 170 or Ask price: null')
    })

    it('validates required parameters', async () => {
      expect((await testAdapter.request({})).statusCode).toBe(400)
      expect((await testAdapter.request({ endpoint: 'stock_quotes', to: 'USD' })).statusCode).toBe(
        400,
      )
    })
  })

  describe('price (ws transport)', () => {
    it('returns the spec example response (last trade price, provider time)', async () => {
      const response = await testAdapter.request(priceRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual({ result: 189.98 })
      expect(body.result).toBe(189.98)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)
    })

    it('serves the record with the newest time when Trade and TradeETH both arrive', async () => {
      const response = await testAdapter.request(priceNewestEthRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.result).toBe(191.5)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(1760000005000)
    })

    it('serves TradeETH-only symbols harm-free', async () => {
      const response = await testAdapter.request(priceEthOnlyRequest)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.result).toBe(300)
      expect(body.timestamps?.providerIndicatedTimeUnixMs).toBe(200)
    })
  })
})
