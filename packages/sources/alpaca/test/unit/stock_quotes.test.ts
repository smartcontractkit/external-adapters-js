import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { WebSocket } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { EventEmitter } from 'events'
import nock from 'nock'
import * as stockQuotesModule from '../../src/transport/stock_quotes'
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
  makeConnection,
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

// Spec example request {"from":"AAPL","to":"USD"} after validation: both flags at spec default false
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

  // A quote without a valid t has no provider timestamp, so it is dropped and cannot overwrite a
  // newer cached book
  it('drops quote with unparseable t', () => {
    expect(parseOne(quote())).not.toEqual([])
    const storedTime = transport.latestQuotes.get('AAPL')
    expect(storedTime).toBeDefined()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t: _t, ...withoutT } = quote({ bp: 100, ap: 102 })
    expect(parse(withoutT)).toEqual([])
    expect(parse(quote({ t: 'not-a-date', bp: 100, ap: 102 }))).toEqual([])

    expect(transport.latestQuotes.get('AAPL')).toBe(storedTime)
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
// the spec ws_auth_message. The auth frame handling itself is covered in auth.test.ts.
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

  // A failed token request fails the connect in options(), before any socket exists, so no account
  // connection is taken
  it('options() rejects when the token request fails', async () => {
    const { transport, posts } = newTransport(new Error('Request failed with status code 500'))

    await expect(resolveOptions(transport)).rejects.toBeDefined()
    expect(posts).toHaveLength(1)
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

  // The cache keeps the newer value across a reconnect, so the last-seen t must survive it too
  it('older t after reconnect does not overwrite newer cached quote', async () => {
    register(params())
    expect(parse(quote(NEWER))[0].response.result).toBe(201)

    transport.accessToken = ACCESS_TOKEN
    const { connection } = makeConnection([{ T: 'success', msg: 'authenticated' }])
    await transportConfig.handlers.open?.(connection, context)
    // The framework resubscribes the symbol after open
    register(params())

    // No result means no cache write: the cached response keeps the NEWER values
    expect(parse(quote(OLDER))).toEqual([])
  })

  it('older t after unsubscribe and resubscribe does not overwrite newer cached quote', () => {
    register(params())
    expect(parse(quote(NEWER))[0].response.result).toBe(201)

    expect(unsubscribe(params())).toEqual({ action: 'unsubscribe', quotes: ['AAPL'] })
    register(params())

    expect(parse(quote(OLDER))).toEqual([])
  })
})

// The spec quote param is part of the request: each subscribed variant (quote, requireVolume,
// isOvernight) gets its own result with the params of its request. Expected response: spec
// endpoint_request_response_examples[0] for wire_input.
describe('variant fan-out', () => {
  it('fan-out writes a result for each subscribed quote and flag variant', () => {
    const variants = [
      params({ quote: 'USD', requireVolume: false }),
      params({ quote: 'USD', requireVolume: true }),
      params({ quote: 'USDC', requireVolume: false }),
      params({ quote: 'USDC', requireVolume: true }),
    ]
    register(...variants)

    const jsonParse = jest.spyOn(JSON, 'parse')
    let results: Result[]
    let jsonParseCalls: number
    try {
      results = parse(quote())
      jsonParseCalls = jsonParse.mock.calls.length
    } finally {
      jsonParse.mockRestore()
    }

    expect(jsonParseCalls).toBe(0)
    expect(results).toHaveLength(4)
    expect(results.map((r) => r.params)).toEqual(expect.arrayContaining(variants))
    results.forEach((r) =>
      expect(r.response).toEqual({
        result: 190.0,
        data: {
          mid_price: 190.0,
          bid_price: 189.95,
          bid_volume: 1,
          ask_price: 190.05,
          ask_volume: 2,
        },
        timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
      }),
    )
  })

  // Spec requireVolume (dxfeed compat): an invalid volume is a 502 only for requireVolume=true
  it('requireVolume=true with an invalid volume gives 502, requireVolume=false keeps mid 190.0', () => {
    register(params({ requireVolume: false }), params({ requireVolume: true }))

    const results = parse(quote({ bs: undefined }))
    const byFlag = (flag: boolean) => results.find((r) => r.params.requireVolume === flag)

    expect(byFlag(true)?.response).toMatchObject({ statusCode: 502 })
    expect(byFlag(false)?.response.result).toBe(190.0)
  })
})

// Owner decision wire_timestamp=provider_indicated_from_t: a quote without a valid t is dropped.
// Every such drop logs at warn, with no per-symbol warn-once state.
describe('frame without valid t', () => {
  it('frame without valid t is dropped and logged at warn', () => {
    register(params())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t: _t, ...withoutT } = quote()

    expect(parse(withoutT)).toEqual([])
    expect(parse(withoutT)).toEqual([])

    expect(logger.warn).toHaveBeenCalledTimes(2)
  })
})

// The spec needs only millisecond providerIndicatedTimeUnixMs: ordering compares t at millisecond
// precision, so every quote within the stored millisecond is accepted. Only a strictly older
// millisecond is dropped.
describe('parseQuote same-millisecond ordering', () => {
  beforeEach(() => {
    // Spec wire_input t ...15.123456789Z -> spec example response
    const [first] = parseOne(quote())
    expect(first.response).toMatchObject({
      result: 190.0,
      data: { mid_price: 190.0, bid_price: 189.95, ask_price: 190.05 },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })

  it('accepts a newer quote within the same millisecond', () => {
    const results = parse(quote({ t: '2026-09-17T00:30:15.123987654Z', bp: 189.97 }))

    expect(results).not.toEqual([])
    expect(results[0].response).toMatchObject({
      result: 190.01,
      data: { mid_price: 190.01, bid_price: 189.97, ask_price: 190.05 },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })

  it('accepts a quote with a t equal to the stored t', () => {
    const results = parse(quote({ bp: 189.97 }))

    expect(results).not.toEqual([])
    expect(results[0].response).toMatchObject({
      result: 190.01,
      data: { mid_price: 190.01, bid_price: 189.97 },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })

  it('accepts a quote with smaller sub-millisecond digits in the same millisecond', () => {
    const [result] = parse(quote({ t: '2026-09-17T00:30:15.123000001Z', bp: 100, ap: 102 }))

    expect(result.response).toMatchObject({
      result: 101,
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })

  it('drops a quote from an earlier millisecond', () => {
    expect(parse(quote({ t: '2026-09-17T00:30:15.122999999Z', bp: 100, ap: 102 }))).toEqual([])
  })
})

// Error frame code and msg are provider-controlled: they are logged only as structured fields (the
// logger escapes them) under a constant message, so a newline cannot fake a log entry. Plan: a
// provider error frame is skipped with a warn-level log, never a throw or an error-level log.
describe('error frame logging', () => {
  const errorFrameCalls = () => logger.warn.mock.calls as [Record<string, unknown>, string][]

  it('error frame is logged at warn level, not error level, and yields no result', () => {
    register(params())

    const results = parse({ T: 'error', code: 400, msg: 'invalid syntax' })

    expect(results).toEqual([])
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(errorFrameCalls()[0][0]).toMatchObject({ code: 400, msg: 'invalid syntax' })
  })

  it('error frame logs code and msg as structured fields under a constant message', () => {
    const injected = 'bad\nFAKE LOG ENTRY'
    parse({ T: 'error', code: 400, msg: injected })
    parse({ T: 'error', code: 405, msg: 'symbol limit exceeded' })

    expect(errorFrameCalls()).toHaveLength(2)
    const [[fields, message], [otherFields, otherMessage]] = errorFrameCalls()
    expect(fields).toMatchObject({ code: 400, msg: injected })
    expect(otherFields).toMatchObject({ code: 405, msg: 'symbol limit exceeded' })
    expect(typeof message).toBe('string')
    expect(message).toBe(otherMessage)
    expect(message).not.toContain('FAKE LOG')
  })
})

// Alpaca can still deliver a quote after the unsubscribe; it must not write the cache
describe('parseQuote subscription check', () => {
  it('ignores quotes for unsubscribed symbols', () => {
    register(params({ base: 'SPY' }))

    expect(parse(quote())).toEqual([])
  })

  it('frames for unsubscribed symbols are dropped before parse', () => {
    register(params({ base: 'SPY' }))
    const parseQuoteSpy = jest.spyOn(stockQuotesModule, 'parseQuote')

    try {
      expect(parse(quote())).toEqual([])
      expect(parseQuoteSpy).not.toHaveBeenCalled()
    } finally {
      parseQuoteSpy.mockRestore()
    }
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

  // Spec data_freshness names only timestamp_field t and has no future-skew rule, so a host clock
  // that lags the provider still serves every quote
  it('accepts a quote with t far ahead of host clock', () => {
    const AHEAD = new Date(Date.parse(NOW) + 60_000).toISOString()
    const [result] = parseOne(quote({ t: AHEAD, bp: 200, ap: 202 }))

    expect(result.response).toMatchObject({
      result: 201,
      data: { mid_price: 201, bid_price: 200, ask_price: 202 },
      timestamps: { providerIndicatedTimeUnixMs: Date.parse(AHEAD) },
    })
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

// Spec response_mapping mid_price (bp + ap) / 2, exact in decimal (no binary float error)
describe('computeMidPrice decimal', () => {
  it('computeMidPrice returns exact decimal mid', () => {
    expect(computeMidPrice(1.1, 2.2)).toBe(1.65)
  })
})

// Owner decision one_sided_semantics=match_reference: bid 0 gives mid = ask, ask 0 gives mid = bid.
// Spec wind_down_frames: both sides zero has no mid.
describe('computeMidPrice one-sided book', () => {
  it('two-sided spec wire_input bp 189.95 / ap 190.05 gives 190.0', () => {
    expect(computeMidPrice(189.95, 190.05)).toBe(190.0)
  })

  it('bid 0 gives mid = ask', () => {
    expect(computeMidPrice(0, 190.05)).toBe(190.05)
  })

  it('ask 0 gives mid = bid', () => {
    expect(computeMidPrice(189.95, 0)).toBe(189.95)
  })

  it('both sides 0 gives no mid', () => {
    expect(computeMidPrice(0, 0)).toBeUndefined()
  })
})

// parseQuote is the pure wire-frame mapper (spec response_mapping)
describe('parseQuote field mapping', () => {
  // Owner decision wire_timestamp=provider_indicated_from_t: the nanosecond RFC3339 t is truncated
  // to Unix ms (spec example 2026-09-17T00:30:15.123456789Z -> 1789605015123)
  it('maps t to providerIndicatedTimeUnixMs 1789605015123', () => {
    expect(parseQuote(quote())?.timestamps.providerIndicatedTimeUnixMs).toBe(1789605015123)
  })

  it('maps a whole-second t without a fraction to its Unix ms', () => {
    expect(parseQuote(quote({ t: '2026-09-17T00:30:15Z' }))?.timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1789605015000,
    })
  })

  it.each([
    ['missing', undefined],
    ['not a time', 'not-a-time'],
    ['numeric', 1789605015123],
  ])('returns no response when t is %s', (_, t) => {
    expect(parseQuote(quote({ t }))).toBeUndefined()
  })

  // Owner decision one_sided_semantics=match_reference: the zero side reports as-is, never null
  it('bid 0 reports bid_price 0 and mid_price = ask', () => {
    const data = parseQuote(quote({ bp: 0, bs: 0 }))?.data
    expect(data?.mid_price).toBe(190.05)
    expect(data?.bid_price).toBe(0)
    expect(data?.bid_volume).toBe(0)
    expect(data?.ask_price).toBe(190.05)
    expect(data?.ask_volume).toBe(2)
  })

  it('ask 0 reports ask_price 0 and mid_price = bid', () => {
    const data = parseQuote(quote({ ap: 0, as: 0 }))?.data
    expect(data?.mid_price).toBe(189.95)
    expect(data?.bid_price).toBe(189.95)
    expect(data?.bid_volume).toBe(1)
    expect(data?.ask_price).toBe(0)
    expect(data?.ask_volume).toBe(0)
  })

  // Spec wind_down_frames: drop_if_both_sides_zero
  it('both sides 0 returns no response', () => {
    expect(parseQuote(quote({ bp: 0, bs: 0, ap: 0, as: 0 }))).toBeUndefined()
  })

  // Spec requireVolume (dxfeed compat): an invalid volume reports as NaN, which the requireVolume=true
  // variant turns into a 502; the lenient variant still gets the mid
  it.each([
    ['bs missing', { bs: undefined }, 'bid_volume'],
    ['as not a number', { as: 'x' }, 'ask_volume'],
    ['bs negative', { bs: -1 }, 'bid_volume'],
  ])('%s reports that volume as NaN and keeps mid 190.0', (_, fields, key) => {
    const data = parseQuote(quote(fields))?.data as Record<string, number> | undefined
    expect(data?.[key]).toBeNaN()
    expect(data?.mid_price).toBe(190.0)
  })
})

// Alpaca sends quotes only for subscribed symbols, so parsing does not depend on subscriptions.
// Expected values: spec endpoint_request_response_examples[0] response for wire_input.
describe('parseQuote without variants', () => {
  it('parseQuote maps the spec wire_input to mid 190.0, bid/ask prices and volumes, providerIndicatedTimeUnixMs 1789605015123', () => {
    const response = parseQuote(quote())

    expect(response).toEqual({
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
