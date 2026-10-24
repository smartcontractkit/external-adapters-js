/**
 * Endpoint wiring tests — OPDATA-9200 spec, external_adapter_specifications
 * .endpoints. Asserts the endpoint surface and transport-routing contract
 * through the adapter's real request path:
 * - stock_quotes serves the spec example response for the overrides.dxfeed
 *   resolved ticker
 * - price (aliases crypto/stock/forex/commodities) with default_transport rest
 * - a price request pinned to transport "ws" routes to the dxLink WS transport
 * - a price request without a transport param routes to the untouched REST
 *   transport (owner decision rest_transport_scope = keep_untouched) and never
 *   opens a WS subscription
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import nock from 'nock'
import { mockPriceEndpointWithSymbols } from '../integration/fixtures'
import {
  flushFrames,
  quoteFrame,
  quoteRecord,
  restResponse,
  ScriptedDxLinkServer,
  tradeFrame,
  tradeRecord,
} from './fixtures'

const WS_URL = 'ws://localhost:9095/dxlink-endpoint'

describe('dxfeed endpoint wiring', () => {
  let oldEnv: NodeJS.ProcessEnv
  let server: ScriptedDxLinkServer
  let testAdapter: TestAdapter

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
    // Spec sample_response (stock_quotes): the newest record is the spec
    // example response (bid 189.90 / ask 190.10 / volumes 50/80, time ...001).
    server.setFeedData('Quote', 'ORCL:USLF24', [
      quoteFrame(
        quoteRecord('ORCL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'),
        quoteRecord('ORCL:USLF24', 1760000001000, 189.9, 190.1, 50, 80, 'O', 'O'),
      ),
    ])
    // Spec sample_response (price): Trade at 189.98, time 1760000000000.
    server.setFeedData('Trade', 'CRM:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'CRM:USLF24', 1760000000000, 189.98)),
    ])
    // Bare ticker (no override) for the base-only param-surface tests.
    server.setFeedData('Quote', 'BBY', [
      quoteFrame(quoteRecord('BBY', 1760000002000, 140, 141, 9, 8, 'O', 'O')),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    const adapter = (await import('./../../src')).adapter
    // rateLimiting stays: undefined makes the fixed-interval period 0, which starves fake-timer ticks
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('stock_quotes resolves the overrides.dxfeed ticker and returns the spec example response', async () => {
    const response = await testAdapter.request({
      endpoint: 'stock_quotes',
      base: 'ORCL',
      quote: 'USD',
      overrides: { dxfeed: { ORCL: 'ORCL:USLF24' } },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    // Spec example response fields, asserted explicitly (no snapshot).
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

  it('a price request with transport "ws" routes to the dxLink WS transport', async () => {
    const response = await testAdapter.request({
      endpoint: 'stock',
      from: 'CRM',
      to: 'USD',
      transport: 'ws',
      overrides: { dxfeed: { CRM: 'CRM:USLF24' } },
    })
    expect(response.statusCode).toBe(200)
    // The value comes from the WS Trade stream, not REST.
    expect(response.json().data.result).toBe(189.98)
    expect(response.json().result).toBe(189.98)
    expect(response.json().timestamps?.providerIndicatedTimeUnixMs).toBe(1760000000000)
    // The WS transport subscribed (Quote is stock_quotes-only; Trade is price).
    expect(server.added()).toEqual(
      expect.arrayContaining([{ symbol: 'CRM:USLF24', type: 'Trade' }]),
    )
  })

  it('a price request without a transport param routes to rest and never opens a WS subscription', async () => {
    mockPriceEndpointWithSymbols({ NVDA: 239.255 })
    const response = await restResponse(testAdapter, {
      endpoint: 'stock',
      from: 'NVDA',
      to: 'USD',
    })
    expect(response.statusCode).toBe(200)
    // The value comes from the mocked REST endpoint, not the WS stream.
    expect(response.json().data.result).toBe(239.255)
    expect(response.json().result).toBe(239.255)
    // No FEED_SUBSCRIPTION was ever sent for the symbol.
    await flushFrames(testAdapter)
    expect(server.added().some((s) => s.symbol.includes('NVDA'))).toBe(false)
  })

  it('a price alias (crypto) resolves to the price endpoint with its default rest transport', async () => {
    mockPriceEndpointWithSymbols({ XAU: 4123.25 })
    const response = await restResponse(testAdapter, {
      endpoint: 'crypto',
      from: 'XAU',
      to: 'USD',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(4123.25)
    await flushFrames(testAdapter)
    expect(server.added().some((s) => s.symbol.includes('XAU'))).toBe(false)
  })

  it('stock_quotes serves base-only requests (`to` is accepted but ignored)', async () => {
    // parity_diff.preserve.param_surface: the surface is base-only; extra
    // request fields like `to` are ignored by validation, exactly as the
    // legacy adapter did (spec §5 price input_parameters note). Both the
    // spec-example spelling (with `to`) and the bare base-only spelling must
    // be served with a 200.
    for (const req of [
      { endpoint: 'stock_quotes', base: 'BBY', to: 'USD' },
      { endpoint: 'stock_quotes', base: 'BBY' },
    ]) {
      const response = await testAdapter.request(req)
      expect(response.statusCode).toBe(200)
      expect(response.json().data).toMatchObject({ bid_price: 140, ask_price: 141 })
    }
  })

  it('stock_quotes rejects a request missing the required base param', async () => {
    const response = await testAdapter.request({ endpoint: 'stock_quotes', quote: 'USD' })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: expect.anything() })
  })

  it('price serves a ws-routed request without `to` (base-only param surface)', async () => {
    const response = await testAdapter.request({
      endpoint: 'stock',
      from: 'CRM',
      transport: 'ws',
      overrides: { dxfeed: { CRM: 'CRM:USLF24' } },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().data.result).toBe(189.98)
  })

  it('price rejects a request missing the required base param', async () => {
    const response = await testAdapter.request({ endpoint: 'stock', to: 'USD' })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: expect.anything() })
  })

  it('the forex and commodities aliases resolve to the price endpoint (default rest transport)', async () => {
    // Spec: price aliases are crypto, stock, forex, commodities. crypto and
    // stock are covered above; the remaining two must resolve too.
    mockPriceEndpointWithSymbols({ EUR: 1.085, BRENT: 82.5 })
    for (const endpoint of ['forex', 'commodities']) {
      const response = await restResponse(testAdapter, {
        endpoint,
        from: endpoint === 'forex' ? 'EUR' : 'BRENT',
        to: 'USD',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(endpoint === 'forex' ? 1.085 : 82.5)
      await flushFrames(testAdapter)
      expect(
        server.added().some((s) => s.symbol.includes('EUR') || s.symbol.includes('BRENT')),
      ).toBe(false)
    }
  })

  describe('spec base alias set (from/symbol/asset/coin/ticker/market)', () => {
    // Spec input_parameters: base carries the full alias set on BOTH the
    // stock_quotes and price endpoints; quote carries the `to` alias. Each
    // aliased request must resolve to the same subscription/value as the
    // canonical base/quote spelling.
    const BASE_ALIASES = ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'] as const

    it('resolves every spec base alias on stock_quotes', async () => {
      for (const alias of BASE_ALIASES) {
        const response = await testAdapter.request({
          endpoint: 'stock_quotes',
          [alias]: 'ORCL',
          quote: 'USD',
          overrides: { dxfeed: { ORCL: 'ORCL:USLF24' } },
        })
        expect(response.statusCode).toBe(200)
        expect(response.json().data).toMatchObject({ bid_price: 189.9, ask_price: 190.1 })
        expect(response.json().result).toBeCloseTo(190, 10)
      }
      // Aliases resolve to the same symbol: no extra subscriptions.
      expect(server.added().filter((s) => s.symbol === 'ORCL:USLF24')).toHaveLength(1)
    })

    it('resolves every spec base alias on the price endpoint over ws', async () => {
      for (const alias of BASE_ALIASES) {
        const response = await testAdapter.request({
          endpoint: 'stock',
          [alias]: 'CRM',
          to: 'USD',
          transport: 'ws',
          overrides: { dxfeed: { CRM: 'CRM:USLF24' } },
        })
        expect(response.statusCode).toBe(200)
        expect(response.json().data.result).toBe(189.98)
      }
      expect(
        server.added().filter((s) => s.symbol === 'CRM:USLF24' && s.type === 'Trade'),
      ).toHaveLength(1)
    })
  })
})
