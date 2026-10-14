import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { WebSocket } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { EventEmitter } from 'events'
import nock from 'nock'
import {
  computeMidPrice,
  parseQuote,
  StockQuotesTransport,
  WsTransportTypes,
} from '../../src/transport/stock_quotes'
import {
  ACCESS_TOKEN,
  AUTH_ENDPOINT,
  clearLogs,
  CLIENT_ID,
  CLIENT_SECRET,
  mockLogger,
  WIRE_INPUT,
  WS_API_ENDPOINT,
} from './fixtures'

const logger = mockLogger()

type Result = ProviderResult<WsTransportTypes>
type Params = { base: string; quote: string; requireVolume: boolean; isOvernight: boolean }

// CACHE_MAX_AGE: framework default (ms)
const CACHE_MAX_AGE = 90_000
const context = { adapterSettings: { CACHE_MAX_AGE } } as EndpointContext<WsTransportTypes>

// Spec example request {"from":"AAPL","to":"USD"} after the spec defaults (both flags false)
const params = (overrides: Partial<Params> = {}): Params => ({
  base: 'AAPL',
  quote: 'USD',
  requireVolume: false,
  isOvernight: false,
  ...overrides,
})

// Spec wire_input with field overrides
const quote = (overrides: Record<string, unknown> = {}) => ({ ...WIRE_INPUT, ...overrides })

// A fresh transport per test, so no variant or provider time state leaks between tests
let transport: StockQuotesTransport
let transportConfig: StockQuotesTransport['config']

const register = (...variants: Params[]) =>
  variants.forEach((p) => transportConfig.builders?.subscribeMessage?.(p as never, context))

const parse = (...frames: Record<string, unknown>[]) =>
  transportConfig.handlers.message(
    frames as WsTransportTypes['Provider']['WsMessage'],
    context,
  ) as Result[]

// Parses one frame for a symbol with exactly one registered default variant
const parseOne = (frame: Record<string, unknown>) => {
  register(params({ base: String(frame.S) }))
  return parse(frame)
}

beforeEach(() => {
  clearLogs(logger)
  transport = new StockQuotesTransport()
  transportConfig = transport['config']
})

const unsubscribe = (p: Params) =>
  transportConfig.builders?.unsubscribeMessage?.(p as never, context)

describe('parseQuote', () => {
  // Spec valueRangeMin 0; prices arrive as JSON numbers (valueRangeScalingNotes)
  it.each([
    ['negative bp', { bp: -1 }],
    ['string ap', { ap: '190.05' }],
    ['missing bp', { bp: undefined }],
  ])('drops malformed quote frames (%s)', (_, overrides) => {
    expect(parseOne(quote(overrides))).toEqual([])
  })

  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['not a string', 123],
  ])('ignores quote frames with a missing symbol (S %s)', (_, S) => {
    register(params())

    expect(parse(quote({ S }))).toEqual([])
  })
})

// Owner decision wire_timestamp=provider_indicated_from_t
describe('parseQuote provider timestamp', () => {
  it('truncates sub-millisecond digits instead of rounding', () => {
    const [result] = parseOne(quote({ t: '2026-09-17T00:30:15.999999999Z' }))

    expect(result.response).toHaveProperty('timestamps.providerIndicatedTimeUnixMs', 1789605015999)
  })

  it.each([
    ['missing', undefined],
    ['unparseable', 'not-a-time'],
  ])('%s t -> dropped', (_, t) => {
    expect(parseOne(quote({ t }))).toEqual([])
  })
})

// Spec subscribe format {"action":"subscribe","quotes":["AAPL"]}: one provider subscription per
// symbol, shared by every param variant
describe('subscribeMessage', () => {
  it('subscribes once per symbol across variants', () => {
    const subscribe = (p: Params) =>
      transportConfig.builders?.subscribeMessage?.(p as never, context)

    expect(subscribe(params({ requireVolume: false }))).toEqual({
      action: 'subscribe',
      quotes: ['AAPL'],
    })
    expect(subscribe(params({ requireVolume: true }))).toBeUndefined()
    expect(subscribe(params({ isOvernight: true }))).toBeUndefined()
    expect(subscribe(params({ base: 'aapl' }))).toBeUndefined()
  })
})

// options() fetches the token on each connect (refresh_policy per_connect) and the open handler sends
// the spec ws_auth_message. Any failure must release the socket (15-connection account limit) and
// leave no listener behind.
describe('open handler', () => {
  const openContext = {
    adapterSettings: { AUTH_ENDPOINT, CLIENT_ID, CLIENT_SECRET, WS_API_ENDPOINT },
  } as unknown as EndpointContext<WsTransportTypes>

  // Fake socket over an EventEmitter. It records sent messages and answers nothing unless the
  // test emits a frame or a close itself.
  const fakeSocket = () => {
    const emitter = new EventEmitter()
    const sent: unknown[] = []
    const close = jest.fn()
    type Listener = (...args: unknown[]) => void
    const socket = {
      readyState: WebSocket.OPEN,
      send: (data: string) => sent.push(JSON.parse(data)),
      close,
      addEventListener: (type: string, l: Listener) => emitter.on(type, l),
      removeEventListener: (type: string, l: Listener) => emitter.off(type, l),
      on: (type: string, l: Listener) => emitter.on(type, l),
      once: (type: string, l: Listener) => emitter.once(type, l),
      off: (type: string, l: Listener) => emitter.off(type, l),
      removeListener: (type: string, l: Listener) => emitter.off(type, l),
      listenerCount: (type: string) => emitter.listenerCount(type),
    }
    const emitFrames = (frames: unknown) =>
      emitter.emit('message', { data: JSON.stringify(frames) })
    return { emitter, socket: socket as unknown as WebSocket, sent, close, emitFrames }
  }

  const tokenRequester = (reply: { status: number; data?: unknown } | Error) => {
    const posts: unknown[] = []
    const requester = {
      request: async (_key: string, req: unknown) => {
        posts.push(req)
        if (reply instanceof Error) {
          throw reply
        }
        return { response: reply }
      },
    } as unknown as Requester
    return { requester, posts }
  }

  const resolveUrl = (transport: StockQuotesTransport) =>
    transport['config'].url(openContext, [params()] as never, {
      streamHandlerInvocationsWithNoConnection: 0,
    })

  const resolveOptions = (transport: StockQuotesTransport) =>
    (transport['config'].options as (ctx: typeof openContext) => Promise<unknown>)(openContext)

  // One connect, in framework order: options() (token fetch, refresh_policy per_connect), then open
  const runOpen = async (transport: StockQuotesTransport, socket: WebSocket) => {
    await resolveOptions(transport)
    return transport['config'].handlers.open?.(socket, openContext) as Promise<void>
  }

  // Waits until the auth message is sent, so the auth listeners are attached
  const untilAuthSent = async (sent: unknown[]) => {
    for (let i = 0; i < 50 && !sent.length; i++) {
      await new Promise((resolve) => setImmediate(resolve))
    }
    expect(sent).toEqual([{ action: 'auth', key: 'access_token', secret: ACCESS_TOKEN }])
  }

  const newTransport = (reply: { status: number; data?: unknown } | Error) => {
    const transport = new StockQuotesTransport()
    const { requester, posts } = tokenRequester(reply)
    transport.requester = requester
    return { transport, posts }
  }

  const TOKEN_OK = { status: 200, data: { access_token: ACCESS_TOKEN, expires_in: 900 } }

  // The real framework Requester (axios underneath, intercepted by nock), without retries or rate
  // limiting
  const realRequester = () =>
    new Requester(
      { waitForRateLimit: async () => undefined, msUntilNextExecution: () => 0 } as never,
      {
        RETRY: 0,
        API_TIMEOUT: 1000,
        REQUESTER_SLEEP_BEFORE_REQUEUEING_MS: 0,
        MAX_HTTP_REQUEST_QUEUE_LENGTH: 10,
      } as never,
    )

  // Spec metadata.notes: the provider closes the socket ~10 s after open without auth. The token
  // POST must finish before the socket opens, so the open handler only sends the auth message.
  describe('token fetch in options()', () => {
    beforeAll(() => {
      metrics.initialize()
      nock.disableNetConnect()
    })

    afterEach(() => nock.cleanAll())

    afterAll(() => nock.enableNetConnect())

    // Spec data_source_base_url: url() is the configured WS endpoint and makes no token request
    it('url() returns WS_API_ENDPOINT without a token request', async () => {
      const transport = new StockQuotesTransport()
      transport.requester = realRequester()
      const tokenScope = nock(new URL(AUTH_ENDPOINT).origin)
        .post(new URL(AUTH_ENDPOINT).pathname)
        .reply(200, { access_token: ACCESS_TOKEN, expires_in: 900 })

      await expect(resolveUrl(transport)).resolves.toBe(WS_API_ENDPOINT)
      expect(tokenScope.isDone()).toBe(false)
    })

    it('fetches the OAuth token in options() before the socket opens', async () => {
      const transport = new StockQuotesTransport()
      transport.requester = realRequester()
      const { origin, pathname } = new URL(AUTH_ENDPOINT)
      // Spec token_request: form-encoded client_credentials POST to AUTH_ENDPOINT
      const tokenScope = nock(origin)
        .post(pathname, (body) => {
          const form = new URLSearchParams(body)
          return (
            form.get('grant_type') === 'client_credentials' &&
            form.get('client_id') === CLIENT_ID &&
            form.get('client_secret') === CLIENT_SECRET
          )
        })
        .reply(200, { access_token: ACCESS_TOKEN, expires_in: 900 })

      await resolveOptions(transport)
      expect(tokenScope.isDone()).toBe(true)

      // No interceptor is left and net connect is off, so any further HTTP call would fail the open
      nock.cleanAll()
      const { socket, sent, emitFrames } = fakeSocket()
      const opened = transport['config'].handlers.open?.(socket, openContext) as Promise<void>
      // Spec token_usage.ws_auth_message
      await untilAuthSent(sent)
      emitFrames([{ T: 'success', msg: 'authenticated' }])
      await expect(opened).resolves.toBeUndefined()
    })

    // refresh_policy per_connect: each connect gets a new token
    it('fetches a new token on each options() call', async () => {
      const transport = new StockQuotesTransport()
      transport.requester = realRequester()
      const { origin, pathname } = new URL(AUTH_ENDPOINT)
      const tokenScope = nock(origin)
        .post(pathname)
        .times(2)
        .reply(200, { access_token: ACCESS_TOKEN, expires_in: 900 })

      await resolveOptions(transport)
      await resolveOptions(transport)

      expect(tokenScope.isDone()).toBe(true)
    })
  })

  it('auth fails on provider close', async () => {
    const { transport } = newTransport(TOKEN_OK)
    const { emitter, socket, sent } = fakeSocket()
    const startMessage = emitter.listenerCount('message')
    const startClose = emitter.listenerCount('close')

    const opened = runOpen(transport, socket)
    opened.catch(() => undefined)
    await untilAuthSent(sent)
    expect(emitter.listenerCount('message')).toBeGreaterThan(startMessage)

    emitter.emit('close', { code: 1006, reason: '' })

    await expect(opened).rejects.toBeDefined()
    expect(emitter.listenerCount('message')).toBe(startMessage)
    expect(emitter.listenerCount('close')).toBe(startClose)
  })

  it('authenticate removes its listeners on the authenticated frame', async () => {
    const { transport } = newTransport(TOKEN_OK)
    const { emitter, socket, sent, close, emitFrames } = fakeSocket()

    const opened = runOpen(transport, socket)
    await untilAuthSent(sent)
    emitFrames([{ T: 'success', msg: 'authenticated' }])

    await expect(opened).resolves.toBeUndefined()
    expect(emitter.listenerCount('message')).toBe(0)
    expect(emitter.listenerCount('close')).toBe(0)
    expect(close).not.toHaveBeenCalled()
  })

  it('open handler closes the connection when authenticate rejects', async () => {
    const { transport } = newTransport(TOKEN_OK)
    const { emitter, socket, sent, close, emitFrames } = fakeSocket()

    const opened = runOpen(transport, socket)
    opened.catch(() => undefined)
    await untilAuthSent(sent)
    emitFrames([{ T: 'error', code: 402, msg: 'auth failed' }])

    await expect(opened).rejects.toBeDefined()
    expect(close).toHaveBeenCalledTimes(1)
    expect(emitter.listenerCount('message')).toBe(0)
    expect(emitter.listenerCount('close')).toBe(0)
  })

  // A failed token request fails the connect in options(), before any socket exists, so no account
  // connection is taken
  it('options() rejects when the token request fails', async () => {
    const { transport, posts } = newTransport(new Error('Request failed with status code 500'))

    await expect(resolveOptions(transport)).rejects.toBeDefined()
    expect(posts).toHaveLength(1)
  })

  describe('with fake timers', () => {
    // setImmediate stays real so untilAuthSent can yield to the token fetch
    beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] }))
    afterEach(() => jest.useRealTimers())

    // Spec data_source_endpoints[stock_quotes].timeout_ms 10000: the auth deadline must not
    // outlive a successful auth
    it('clears auth timer on authenticated', async () => {
      const { transport } = newTransport(TOKEN_OK)
      const { socket, sent, emitFrames } = fakeSocket()

      const opened = runOpen(transport, socket)
      await untilAuthSent(sent)
      expect(jest.getTimerCount()).toBeGreaterThan(0)
      emitFrames([{ T: 'success', msg: 'authenticated' }])

      await expect(opened).resolves.toBeUndefined()
      expect(jest.getTimerCount()).toBe(0)
    })
  })
})

// Spec data_freshness timestamp_field t: an older quote never overwrites a newer one
describe('parseQuote quote ordering', () => {
  const NEWER = { t: '2026-09-17T00:31:00Z', bp: 200, ap: 202 }
  const OLDER = { t: '2026-09-17T00:30:00Z', bp: 380, ap: 382 }

  it('drops an older quote that arrives after a newer one', () => {
    expect(parseOne(quote(NEWER))[0].response.result).toBe(201)

    expect(parse(quote(OLDER))).toEqual([])
    expect(logger.debug).toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('accepts the first quote with no seed', () => {
    const results = parseOne(quote({ t: '2000-01-01T00:00:00Z' }))

    expect(results).not.toEqual([])
    results.forEach((r) => expect(r.response.result).toBe(190.0))
  })

  it('accepts an older quote for a different symbol', () => {
    register(params(), params({ base: 'SPY' }))
    parse(quote(NEWER))

    expect(parse(quote({ S: 'SPY', ...OLDER }))[0].response.result).toBe(381)
  })

  // Spec subscribe format: one provider subscription per symbol, released with the last variant
  it('unsubscribes only after last variant removed', () => {
    register(params({ requireVolume: false }), params({ requireVolume: true }))

    expect(unsubscribe(params({ requireVolume: true }))).toBeUndefined()
    expect(unsubscribe(params({ requireVolume: false }))).toEqual({
      action: 'unsubscribe',
      quotes: ['AAPL'],
    })
  })

  // Variants share one provider subscription: the symbol's last t guards until the last variant
  // leaves, then the entry is released so the map tracks only subscribed symbols
  it('removes latestQuotes entry when the last variant of a symbol unsubscribes', () => {
    register(params({ requireVolume: true }), params({ requireVolume: false }))
    parse(quote(NEWER))
    expect(transport.latestQuotes.size).toBe(1)

    expect(unsubscribe(params({ requireVolume: true }))).toBeUndefined()
    expect(transport.latestQuotes.has('AAPL')).toBe(true)
    expect(parse(quote(OLDER))).toEqual([])

    expect(unsubscribe(params({ requireVolume: false }))).toEqual({
      action: 'unsubscribe',
      quotes: ['AAPL'],
    })
    expect(transport.latestQuotes.has('AAPL')).toBe(false)
    expect(transport.latestQuotes.size).toBe(0)
  })
})

// Spec response_mapping provider_timestamp t: ordering uses the millisecond providerIndicatedTimeUnixMs.
// A quote whose t is not newer than the stored t (same millisecond included) is dropped.
describe('parseQuote same-millisecond ordering', () => {
  it('drops a quote with the same millisecond t as the stored quote', () => {
    // Spec wire_input t ...15.123456789Z -> spec example response
    const [first] = parseOne(quote())
    expect(first.response).toMatchObject({
      result: 190.0,
      data: { mid_price: 190.0, bid_price: 189.95, ask_price: 190.05 },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })

    expect(parse(quote({ t: '2026-09-17T00:30:15.123000001Z', bp: 100, ap: 102 }))).toEqual([])
  })
})

// Alpaca can still deliver a quote after the unsubscribe; it must not write the cache
describe('parseQuote subscription check', () => {
  it('ignores quotes for unsubscribed symbols', () => {
    register(params({ base: 'SPY' }))

    expect(parse(quote())).toEqual([])
  })
})

// Spec data_freshness timestamp_field t: the ordering guard has no age limit, so the cached newer
// value is never overwritten by a replayed older quote, however long the subscription lives
describe('parseQuote guard lifetime', () => {
  const NOW = '2026-09-17T00:31:00Z'

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.parse(NOW))
  })
  afterEach(() => jest.useRealTimers())

  it('drops an older replayed quote after CACHE_MAX_AGE has elapsed', () => {
    const T2 = '2026-09-17T00:30:30Z'
    const T1 = '2026-09-17T00:30:00Z'
    const [stored] = parseOne(quote({ t: T2, bp: 200, ap: 202 }))
    expect(stored.response).toMatchObject({
      result: 201,
      data: { mid_price: 201, bid_price: 200, ask_price: 202 },
      timestamps: { providerIndicatedTimeUnixMs: Date.parse(T2) },
    })

    jest.advanceTimersByTime(CACHE_MAX_AGE + 1)

    // No result means no cache write: the cached response keeps the T2 values
    expect(parse(quote({ t: T1, bp: 380, ap: 382 }))).toEqual([])
  })

  // A future-dated t would otherwise block every later quote for the symbol
  it('rejects a quote with t more than 60s in the future', () => {
    expect(parseOne(quote({ t: '2026-09-17T01:31:00Z', bp: 500, ap: 502 }))).toEqual([])

    // The rejected t is not stored, so a quote with a current t is accepted
    const [result] = parse(quote({ t: NOW, bp: 200, ap: 202 }))
    expect(result.response).toMatchObject({
      result: 201,
      data: { mid_price: 201, bid_price: 200, ask_price: 202 },
      timestamps: { providerIndicatedTimeUnixMs: Date.parse(NOW) },
    })
  })

  // Only t MORE than 60s ahead is rejected, so normal provider clock skew is still served
  it('accepts a quote with t exactly 60s in the future', () => {
    const AHEAD = '2026-09-17T00:32:00Z'
    const [result] = parseOne(quote({ t: AHEAD, bp: 200, ap: 202 }))

    expect(result.response).toMatchObject({
      result: 201,
      data: { mid_price: 201, bid_price: 200, ask_price: 202 },
      timestamps: { providerIndicatedTimeUnixMs: Date.parse(AHEAD) },
    })
  })
})

// Spec response_mapping mid_price (bp + ap) / 2, exact in decimal (no binary float error)
describe('computeMidPrice decimal', () => {
  it('computeMidPrice returns exact decimal mid', () => {
    expect(computeMidPrice(1.1, 2.2)).toBe(1.65)
  })
})

// Alpaca sends quotes only for subscribed symbols, so parsing does not depend on subscriptions.
// Expected values: spec endpoint_request_response_examples[0] response for wire_input.
describe('parseQuote without variants', () => {
  it('parseQuote parses a frame without variants', () => {
    expect(parseQuote(quote())).toMatchObject({
      result: 190.0,
      data: {
        mid_price: 190.0,
        bid_price: 189.95,
        bid_volume: 1,
        ask_price: 190.05,
        ask_volume: 2,
      },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })
})
