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
// Longer than the subscription TTL, so the newer cached response outlives the unsubscribe
const CACHE_MAX_AGE_MS = 60000

// t1: the spec sample_response quote, which the mock server replays on every AAPL subscribe
const T1_MS = 1789605015123
// t2 > t1: a newer quote pushed while subscribed
const NEWER_QUOTE = { ...AAPL_QUOTE, bp: 200, bs: 3, ap: 202, as: 4, t: '2026-09-17T00:30:45Z' }
const T2_MS = Date.parse('2026-09-17T00:30:45Z')
const NEWER_RESPONSE = {
  result: 201,
  data: { mid_price: 201, bid_price: 200, bid_volume: 3, ask_price: 202, ask_volume: 4 },
  timestamps: { providerIndicatedTimeUnixMs: T2_MS },
}

// Spec subscribe format, mirrored for unsubscribe
const unsubscribeMessage = (symbol: string) => ({ action: 'unsubscribe', quotes: [symbol] })

// Spec data_freshness timestamp_field t: an older quote never overwrites a newer one while the
// symbol is subscribed. The last-variant unsubscribe releases the symbol's t, so the map tracks only
// subscribed symbols, and the quote the provider sends on resubscribe is accepted.
describe('stock_quotes resubscribe', () => {
  let testAdapter: TestAdapter
  let mockWsServer: MockWebsocketServer | undefined
  let oldEnv: NodeJS.ProcessEnv
  const received: { action?: string; quotes?: string[] }[] = []

  // nock replies on a real timer, so each step also yields real time
  const step = async () => {
    await testAdapter.clock.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
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

  it('guards by t while subscribed and accepts the resubscribe quote after the last unsubscribe', async () => {
    const request = { from: 'AAPL', to: 'USD' }

    // Subscribe: the spec quote (t1) is cached
    let response = await testAdapter.request(request)
    for (let i = 0; i < 10 && response.statusCode !== 200; i++) {
      await step()
      response = await testAdapter.request(request)
    }
    expect(response.statusCode).toBe(200)
    expect(response.json().timestamps.providerIndicatedTimeUnixMs).toBe(T1_MS)

    // A newer quote (t2) replaces it
    pushFrames([NEWER_QUOTE])
    await step()
    response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject(NEWER_RESPONSE)

    // The subscription expires and AAPL is unsubscribed, while the t2 response stays cached
    const unsubscribeMark = received.length
    testAdapter.clock.setSystemTime(Date.now() + SUBSCRIPTION_TTL_MS + 1)
    await step()
    await step()
    await step()
    expect(aaplFrames('unsubscribe', unsubscribeMark)).toEqual([unsubscribeMessage('AAPL')])

    // A new request resubscribes AAPL, and the provider replays the older t1 quote
    const resubscribeMark = received.length
    await testAdapter.request(request)
    for (let i = 0; i < 10 && !aaplFrames('subscribe', resubscribeMark).length; i++) {
      await step()
    }
    expect(aaplFrames('subscribe', resubscribeMark)).toEqual([subscribeMessage('AAPL')])
    await step()
    await step()

    // The released t no longer guards, so the resubscribe quote (t1) is served
    response = await testAdapter.request(request)
    expect(response.statusCode).toBe(200)
    expect(response.json().timestamps.providerIndicatedTimeUnixMs).toBe(T1_MS)
  })
})
