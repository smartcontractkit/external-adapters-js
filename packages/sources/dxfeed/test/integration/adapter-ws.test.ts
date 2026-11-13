/**
 * dxLink endpoint tests: response shape, value policy, volumes, session and
 * Trade/TradeETH ordering.
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

  const request = async (body: object) => testAdapter.request(body)
  const ok = async (body: object) => {
    const response = await request(body)
    expect(response.statusCode).toBe(200)
    return response.json()
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    Object.assign(process.env, {
      WS_API_ENDPOINT: WS_URL,
      API_USERNAME: 'fake-user',
      API_PASSWORD: 'fake-pass',
      WS_SUBSCRIPTION_TTL: '60000',
      WS_SUBSCRIPTION_UNRESPONSIVE_TTL: '60000',
      CACHE_MAX_AGE: '60000',
      WS_CONNECTION_OPEN_TIMEOUT: '2000',
      WS_HEARTBEAT_INTERVAL_MS: '5000',
    })

    server = new ScriptedDxLinkServer(WS_URL)
    server.setFeedData('Quote', 'REG', [
      quoteFrame(quoteRecord('REG', 1760000001000, 189.9, 190.1, 50, 80)),
    ])
    server.setFeedData('Quote', 'OVERNIGHT', [
      quoteFrame(quoteRecord('OVERNIGHT', 1760000001000, 160, 161, 5, 6, 'O', 'O')),
    ])
    server.setFeedData('Quote', 'ZERO', [
      quoteFrame(quoteRecord('ZERO', 1760000001000, 0, 190, 1, 2)),
    ])
    server.setFeedData('Quote', 'NEG', [
      quoteFrame(quoteRecord('NEG', 1760000001000, -1, 190, 1, 2)),
    ])
    server.setFeedData('Quote', 'CROSS', [
      quoteFrame(quoteRecord('CROSS', 1760000001000, 191, 190, 1, 2)),
    ])
    server.setFeedData('Quote', 'NAN', [
      quoteFrame(quoteRecord('NAN', 1760000001000, 'NaN', 190, 1, 2)),
    ])
    server.setFeedData('Quote', 'MISSING_VOLUME', [
      quoteFrame(quoteRecord('MISSING_VOLUME', 1760000001000, 170, 172, 'NaN', 'NaN')),
    ])
    server.setFeedData('Quote', 'BAD_TIME', [
      quoteFrame(quoteRecord('BAD_TIME', NaN, 170, 172, 1, 2)),
    ])
    server.setFeedData('Trade', 'TRADE:USLF24', [
      tradeFrame('Trade', tradeRecord('Trade', 'TRADE:USLF24', 1760000000000, 189.98)),
    ])
    server.setFeedData('TradeETH', 'TRADE:USLF24', [
      tradeFrame('TradeETH', tradeRecord('TradeETH', 'TRADE:USLF24', 1760000005000, 191.5)),
    ])
    server.setFeedData('Trade', 'BAD_PRICE', [
      tradeFrame('Trade', tradeRecord('Trade', 'BAD_PRICE', 1760000000000, 'NaN')),
    ])

    mockWebSocketProvider(WebSocketClassProvider)
    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await ok({ base: 'REG', quote: 'USD', endpoint: 'stock_quotes' })
    await ok({
      endpoint: 'stock',
      from: 'TRADE:USLF24',
      to: 'USD',
      transport: 'ws',
    })
    await testAdapter.waitForCache(2)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    server.server.close()
    ;(testAdapter.clock as InstalledClock | undefined)?.uninstall()
    await testAdapter.api.close()
  })

  it('returns the stock quote shape', async () => {
    const body = await ok({ base: 'REG', quote: 'USD', endpoint: 'stock_quotes' })
    expect(body.data).toMatchObject({
      mid_price: 190,
      midSource: 'computed',
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(body.result).toBeNull()
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1760000001000)
  })

  it('serves an O/O quote under isOvernight', async () => {
    const body = await ok({
      base: 'OVERNIGHT',
      quote: 'USD',
      endpoint: 'stock_quotes',
      isOvernight: true,
    })
    expect(body.data).toMatchObject({ bid_price: 160, ask_price: 161 })
  })

  it.each([
    ['ZERO', 'zero bid'],
    ['NEG', 'negative bid'],
    ['CROSS', 'crossed book'],
    ['NAN', 'non-numeric bid'],
  ])('rejects %s (%s) instead of repairing it', async (base) => {
    const response = await request({ base, quote: 'USD', endpoint: 'stock_quotes' })
    expect(response.statusCode).toBe(502)
    expect(response.json().error ?? response.json().errorMessage).toBeDefined()
  })

  it('returns null volumes by default and rejects them with requireVolume', async () => {
    const body = await ok({ base: 'MISSING_VOLUME', quote: 'USD', endpoint: 'stock_quotes' })
    expect(body.data.bid_volume).toBeNull()
    expect(body.data.ask_volume).toBeNull()

    const response = await request({
      base: 'MISSING_VOLUME',
      quote: 'USD',
      endpoint: 'stock_quotes',
      requireVolume: true,
    })
    expect(response.statusCode).toBe(502)
  })

  it('serves the newest Trade or TradeETH price by provider time', async () => {
    const body = await ok({
      endpoint: 'stock',
      from: 'TRADE:USLF24',
      to: 'USD',
      transport: 'ws',
    })
    expect(body.result).toBe(191.5)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1760000005000)
  })

  it('rejects an invalid trade price', async () => {
    const response = await request({
      endpoint: 'stock',
      from: 'BAD_PRICE',
      to: 'USD',
      transport: 'ws',
    })
    expect(response.statusCode).toBe(502)
  })

  it('rejects a quote with an invalid provider time', async () => {
    const response = await request({ base: 'BAD_TIME', quote: 'USD', endpoint: 'stock_quotes' })
    expect(response.statusCode).toBe(502)
  })
})
