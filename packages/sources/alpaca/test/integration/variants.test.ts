import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  MockWebsocketServer,
  TestAdapter,
  mockWebSocketProvider,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import nock from 'nock'
import {
  AAPL_QUOTE,
  CLIENT_ID,
  CLIENT_SECRET,
  WS_API_ENDPOINT,
  mockTokenResponse,
  mockWebsocketServer,
  pushFrames,
  subscribeMessage,
} from './fixtures'

// Captured before FakeTimers.install replaces the global
const realSetTimeout = setTimeout

const SUBSCRIPTION_TTL_MS = 10000
// Shorter than the subscription TTL, so a jump past the TTL also expires every cached response
const CACHE_MAX_AGE_MS = 5000

// Spec subscribe format, mirrored for unsubscribe
const unsubscribeMessage = (symbol: string) => ({ action: 'unsubscribe', quotes: [symbol] })

// A fresh adapter, so these tests control every AAPL variant (requireVolume / isOvernight) that is
// subscribed. Spec input_parameters: both flags default false; one provider subscription per symbol.
describe('stock_quotes param variants', () => {
  let testAdapter: TestAdapter
  let mockWsServer: MockWebsocketServer | undefined
  let oldEnv: NodeJS.ProcessEnv
  const received: { action?: string; quotes?: string[] }[] = []

  // nock replies on a real timer, so each step also yields real time
  const step = async () => {
    await testAdapter.clock.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  const requestUntilCached = async (params: Record<string, unknown>) => {
    let response = await testAdapter.request(params)
    for (let i = 0; i < 10 && response.statusCode !== 200; i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  // A new variant of an already subscribed AAPL shares its provider subscription, so it is served
  // from the next quote the provider sends: register the variant, then push that quote. Each push
  // carries a newer t, because a quote whose t is not newer than the stored t is dropped.
  let nextQuoteMs = Date.parse(AAPL_QUOTE.t)
  const requestNewAaplVariant = async (params: Record<string, unknown>) => {
    await testAdapter.request(params)
    await step()
    nextQuoteMs += 1000
    pushFrames([{ ...AAPL_QUOTE, t: new Date(nextQuoteMs).toISOString() }])
    return requestUntilCached(params)
  }

  // Moves the clock past every subscription TTL without running timers, so all current
  // subscriptions are expired at the next background run
  const jumpPastTtl = () => testAdapter.clock.setSystemTime(Date.now() + SUBSCRIPTION_TTL_MS + 1)

  const expireAll = async () => {
    jumpPastTtl()
    await step()
    await step()
  }

  const aaplFrames = (action: string, from = 0) =>
    received.slice(from).filter((m) => m.action === action && m.quotes?.includes('AAPL'))

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CLIENT_ID'] = CLIENT_ID
    process.env['CLIENT_SECRET'] = CLIENT_SECRET
    delete process.env['AUTH_ENDPOINT']
    delete process.env['WS_API_ENDPOINT']
    process.env['WS_SUBSCRIPTION_TTL'] = String(SUBSCRIPTION_TTL_MS)
    process.env['CACHE_MAX_AGE'] = String(CACHE_MAX_AGE_MS)

    mockTokenResponse()
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(WS_API_ENDPOINT, received)

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-09-17T00:31:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    nock.cleanAll()
    nock.restore()
  })

  // Spec input_parameters: requireVolume and isOvernight default false, so a request without them
  // is the same request as one with both set to false
  it('absent flags equal false', async () => {
    const absent = await requestUntilCached({ base: 'AAPL', quote: 'USD' })
    expect(absent.statusCode).toBe(200)
    const subscribesBefore = aaplFrames('subscribe').length

    const explicitFalse = await testAdapter.request({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: false,
      isOvernight: false,
    })
    expect(explicitFalse.statusCode).toBe(200)
    // Same served values
    const { data, result, timestamps } = absent.json()
    expect(explicitFalse.json()).toMatchObject({ data, result, timestamps })
    expect(explicitFalse.json().data.mid_price).toBe(190.0)

    // Same request, so no new provider subscription
    await step()
    expect(aaplFrames('subscribe')).toHaveLength(subscribesBefore)
  })

  // dxfeed-compat fan-out: one quote frame for a symbol serves every param variant subscribed for
  // it, over a single provider subscription
  it('one quote frame serves every param variant of the symbol', async () => {
    const variants = [
      { base: 'AAPL', quote: 'USD' },
      { base: 'AAPL', quote: 'USD', requireVolume: true },
      { base: 'AAPL', quote: 'USD', isOvernight: true },
    ]
    const mark = received.length
    for (const params of variants) {
      expect((await requestNewAaplVariant(params)).statusCode).toBe(200)
    }

    nextQuoteMs += 1000
    const t = new Date(nextQuoteMs).toISOString()
    pushFrames([{ ...AAPL_QUOTE, bp: 200, bs: 3, ap: 202, as: 4, t }])
    await step()

    for (const params of variants) {
      const response = await testAdapter.request(params)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        result: 201,
        data: { mid_price: 201, bid_price: 200, bid_volume: 3, ask_price: 202, ask_volume: 4 },
        timestamps: { providerIndicatedTimeUnixMs: nextQuoteMs },
      })
    }
    // AAPL was already subscribed: the new variants add no provider subscribe
    expect(aaplFrames('subscribe', mark)).toEqual([])
  })

  // Spec requireVolume: the same quote with an invalid (missing) bid volume is a 502 for the
  // requireVolume=true variant, while the default variant still serves the mid price
  it('fans out a missing-volume quote as 502 for requireVolume only', async () => {
    const lenient = { base: 'AAPL', quote: 'USD' }
    const strict = { base: 'AAPL', quote: 'USD', requireVolume: true }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bs: _bs, ...noBidVolume } = AAPL_QUOTE
    // The framework cache never replaces an unexpired success with an error, so the cached
    // successes from the previous test must expire first. The requests refresh both subscriptions,
    // and the jump past CACHE_MAX_AGE stays inside WS_SUBSCRIPTION_TTL.
    await testAdapter.request(lenient)
    await testAdapter.request(strict)
    testAdapter.clock.setSystemTime(Date.now() + CACHE_MAX_AGE_MS + 1)
    nextQuoteMs += 1000
    pushFrames([{ ...noBidVolume, t: new Date(nextQuoteMs).toISOString() }])
    await step()

    const lenientResponse = await testAdapter.request(lenient)
    expect(lenientResponse.statusCode).toBe(200)
    expect(lenientResponse.json()).toMatchObject({
      result: 190.0,
      data: { mid_price: 190.0, bid_price: 189.95, ask_price: 190.05, ask_volume: 2 },
    })
    expect((await testAdapter.request(strict)).statusCode).toBe(502)
  })

  // One provider subscription per symbol: when the last AAPL variant expires, AAPL is unsubscribed
  // exactly once in the spec message format
  it('unsubscribes the symbol when all variants expire together', async () => {
    await expireAll()
    // The resubscribe replay carries an older t than the last pushed quote, so push a newer one
    expect((await requestNewAaplVariant({ base: 'AAPL', quote: 'USD' })).statusCode).toBe(200)
    expect(
      (await requestNewAaplVariant({ base: 'AAPL', quote: 'USD', requireVolume: true })).statusCode,
    ).toBe(200)

    const mark = received.length
    jumpPastTtl()
    await step()
    await step()
    await step()

    expect(aaplFrames('unsubscribe', mark)).toEqual([unsubscribeMessage('AAPL')])
  })

  // A variant expires in the same background run that a new variant of the symbol is added: the
  // provider subscription must stay, and the new variant must receive quotes
  it('swaps variants of one symbol in one background run', async () => {
    await expireAll()
    const mark = received.length

    // The resubscribe replay carries an older t than the last pushed quote, so push a newer one
    const oldVariant = await requestNewAaplVariant({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: false,
    })
    expect(oldVariant.statusCode).toBe(200)

    jumpPastTtl()
    const newVariant = await requestNewAaplVariant({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: true,
    })

    expect(newVariant.statusCode).toBe(200)
    expect(newVariant.json().data.mid_price).toBe(190.0)
    expect(aaplFrames('unsubscribe', mark)).toEqual([])
    expect(aaplFrames('subscribe', mark)).not.toHaveLength(0)
    for (const frame of aaplFrames('subscribe', mark)) {
      expect(frame).toEqual(subscribeMessage('AAPL'))
    }
  })
})
