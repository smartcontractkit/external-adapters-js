import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  parseQuote,
  StockQuotesTransport,
  WsTransportTypes,
} from '../../src/transport/stock_quotes'
import { computeMidPrice } from '../../src/transport/utils'
import { ACCESS_TOKEN, clearLogs, makeConnection, mockLogger, WIRE_INPUT } from './fixtures'

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

// The framework's subscriptionSet owns the desired set; tests inject a fake with the
// registered params (the interface, not our deleted variants map)
const registered: Params[] = []
const register = (...variants: Params[]) => {
  registered.push(...variants)
  transport.subscriptionSet = {
    getAll: () => registered,
  } as unknown as StockQuotesTransport['subscriptionSet']
}

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
  registered.length = 0
  transport = new StockQuotesTransport()
  transportConfig = transport['config']
})

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

// options() fetches the token on each connect (refresh_policy per_connect) and the open handler sends
// the spec ws_auth_message. The auth frame handling itself is covered in auth.test.ts.

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

    registered.length = 0
    register(params())

    expect(parse(quote(OLDER))).toEqual([])
  })
})

// The spec quote param is part of the request: each subscribed variant (quote, requireVolume,
// isOvernight) gets its own result with the params of its request. Expected response: spec
// endpoint_request_response_examples[0] for wire_input.

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
  it('drops a quote with t implausibly far ahead of host clock (provider clock failure)', () => {
    // An unguarded far-future t would poison latestQuotes and silently starve the feed
    const AHEAD = new Date(Date.parse(NOW) + 3_600_000).toISOString()
    expect(parseOne(quote({ t: AHEAD, bp: 200, ap: 202 }))).toEqual([])
    expect(logger.warn).toHaveBeenCalled()
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

  // Doc wind_down_frames: null a zero side (price and volume together); mid is the non-zero side
  it('bid 0 reports null bid side and mid_price = ask', () => {
    const data = parseQuote(quote({ bp: 0, bs: 0 }))?.data
    expect(data?.mid_price).toBe(190.05)
    expect(data?.bid_price).toBeNull()
    expect(data?.bid_volume).toBeNull()
    expect(data?.ask_price).toBe(190.05)
    expect(data?.ask_volume).toBe(2)
  })

  it('ask 0 reports null ask side and mid_price = bid', () => {
    const data = parseQuote(quote({ ap: 0, as: 0 }))?.data
    expect(data?.mid_price).toBe(189.95)
    expect(data?.bid_price).toBe(189.95)
    expect(data?.bid_volume).toBe(1)
    expect(data?.ask_price).toBeNull()
    expect(data?.ask_volume).toBeNull()
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
        t: '2026-09-17T00:30:15.123456789Z',
      },
      timestamps: { providerIndicatedTimeUnixMs: 1789605015123 },
    })
  })
})
