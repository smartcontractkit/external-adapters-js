import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocket } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  authMessage,
  StockQuotesTransport,
  subscribeMessage,
  unsubscribeMessage,
  WsTransportTypes,
} from '../../src/transport/stock_quotes'
import {
  ACCESS_TOKEN,
  AUTH_ENDPOINT,
  clearLogs,
  CLIENT_ID,
  CLIENT_SECRET,
  loggedText,
  makeConnection,
  mockLogger,
  WIRE_INPUT,
  WIRE_INPUT_TIME_MS,
  WS_API_ENDPOINT,
} from './fixtures'

const logger = mockLogger()

type Result = ProviderResult<WsTransportTypes>
type Params = { base: string; quote: string; requireVolume: boolean; isOvernight: boolean }

// CACHE_MAX_AGE: framework default (ms)
const context = {
  adapterSettings: {
    AUTH_ENDPOINT,
    CLIENT_ID,
    CLIENT_SECRET,
    WS_API_ENDPOINT,
    CACHE_MAX_AGE: 90_000,
  },
} as unknown as EndpointContext<WsTransportTypes>

const AUTHENTICATED = [{ T: 'success', msg: 'authenticated' }]

// Spec example request after the spec defaults (both flags false)
const params = (overrides: Partial<Params> = {}): Params => ({
  base: 'AAPL',
  quote: 'USD',
  requireVolume: false,
  isOvernight: false,
  ...overrides,
})

// Spec wire_input with overrides
const quote = (overrides: Record<string, unknown> = {}) => ({ ...WIRE_INPUT, ...overrides })

const T1 = '2026-09-17T00:30:00Z'
const T2 = '2026-09-17T00:31:00Z'
const T3 = '2026-09-17T00:32:00Z'

// A fresh transport per test, so no variant, provider time or token state leaks between tests
let transport: StockQuotesTransport
const transportConfig = () => transport['config']

type RequestConfig = Parameters<Requester['request']>[1]

// Stands in for the framework Requester the transport gets in initialize. Each token request takes
// the next reply (the last one repeats); a reply that is an Error rejects the request.
const mockToken = (...replies: unknown[]) => {
  const requests: RequestConfig[] = []
  const queue = replies.length ? replies : [{ access_token: ACCESS_TOKEN, expires_in: 900 }]
  transport.requester = {
    request: async (_key: string, req: RequestConfig) => {
      requests.push(req)
      const reply = queue.length > 1 ? queue.shift() : queue[0]
      if (reply instanceof Error) {
        throw reply
      }
      return { response: { status: 200, data: reply } }
    },
  } as unknown as Requester
  return requests
}

// The framework resolves options() before every socket it opens; options() fetches the token
const resolveOptions = () =>
  (transportConfig().options as (ctx: typeof context) => Promise<unknown>)(context)

// A fake connection in the given ws readyState, answering the auth message with authReply
const connectionIn = (readyState: number, authReply: unknown = AUTHENTICATED) => {
  const fake = makeConnection(authReply)
  Object.assign(fake.connection, { readyState })
  return fake
}

// The open handler on an open socket whose fake server answers the auth message with authReply
const open = async (authReply: unknown = AUTHENTICATED) => {
  const { connection, sent } = connectionIn(WebSocket.OPEN, authReply)
  await transportConfig().handlers.open?.(connection, context)
  return sent
}

// One full connect, in framework order: options() then open()
const connect = async (authReply: unknown = AUTHENTICATED) => {
  await resolveOptions()
  return open(authReply)
}

const handleMessage = (frames: unknown) =>
  transportConfig().handlers.message(
    frames as WsTransportTypes['Provider']['WsMessage'],
    context,
  ) as Result[]

// Each quote fans out to all 4 requireVolume x isOvernight variants (dxfeed mechanism). Keeps the
// spec-default variant entries.
const defaultVariant = (results: Result[]) =>
  results.filter((r) => !r.params.requireVolume && !r.params.isOvernight)

const subscribe = (p: Params) => transportConfig().builders?.subscribeMessage?.(p as never, context)
const unsubscribe = (p: Params) =>
  transportConfig().builders?.unsubscribeMessage?.(p as never, context)

beforeEach(() => {
  clearLogs(logger)
  transport = new StockQuotesTransport()
})

// Spec data_source_authentication: OAuth client credentials, refresh_policy per_connect. options()
// runs once per connect and fetches the token before the socket opens; the open handler only sends
// the auth message.
describe('connect auth', () => {
  // Spec token_request + token_usage.ws_auth_message; refresh_policy per_connect: no token reuse
  it('fetches a new token on each connect with form-encoded client_credentials body', async () => {
    const requests = mockToken(
      { access_token: 'fake-access-token-1', expires_in: 900 },
      { access_token: 'fake-access-token-2', expires_in: 900 },
    )

    await resolveOptions()
    expect(requests).toHaveLength(1)
    expect(await open()).toEqual([authMessage('fake-access-token-1')])
    expect(requests).toHaveLength(1)

    expect(await connect()).toEqual([authMessage('fake-access-token-2')])

    expect(requests).toHaveLength(2)
    requests.forEach((req) => {
      expect(req.url).toBe(AUTH_ENDPOINT)
      expect(req.method?.toUpperCase()).toBe('POST')
      const contentType = Object.entries(req.headers ?? {}).find(
        ([key]) => key.toLowerCase() === 'content-type',
      )?.[1]
      expect(contentType).toBe('application/x-www-form-urlencoded')
      expect(Object.fromEntries(new URLSearchParams(req.data))).toEqual({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      })
    })
  })

  // Spec token_response.access_token_field; the token response body is never echoed in the error.
  // The connect fails in options(), before any socket is opened.
  it('throws without token text when access_token is missing', async () => {
    const body = { token_type: 'bearer', expires_in: 900, note: 'fake-body-text' }
    mockToken(body)

    const error = await resolveOptions().then(
      () => undefined,
      (e: { statusCode?: number; message: string }) => e,
    )

    expect(error?.statusCode).toBe(502)
    expect(error?.message).not.toContain('fake-body-text')
    expect(error?.message).not.toContain(CLIENT_SECRET)
  })

  // Spec stock_quotes timeout_ms 10000: a silent provider must not hold one of the 15 account
  // connections, so auth fails and the socket closes at the deadline
  it('rejects and closes the socket when the provider never sends authenticated', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
    try {
      mockToken()
      await resolveOptions()
      const { connection, sent, close } = connectionIn(WebSocket.OPEN, [])

      const opened = Promise.resolve(transportConfig().handlers.open?.(connection, context))
      opened.catch(() => undefined)
      await new Promise((resolve) => setImmediate(resolve))
      expect(sent).toEqual([authMessage(ACCESS_TOKEN)])

      jest.advanceTimersByTime(9999)
      expect(close).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)

      await expect(opened).rejects.toThrow('Alpaca WS auth timed out')
      expect(close).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  // Spec stock_quotes timeout_ms 10000 and the provider's ~10 s auth deadline
  it('token request has a timeout of at most 10000 ms', async () => {
    const requests = mockToken()

    await resolveOptions()

    expect(requests[0].timeout).toBeGreaterThan(0)
    expect(requests[0].timeout).toBeLessThanOrEqual(10000)
  })

  it('resolves open only after the authenticated frame', async () => {
    mockToken()
    await resolveOptions()
    let opened = false

    const { connection } = connectionIn(WebSocket.OPEN, [{ T: 'success', msg: 'connected' }])
    void Promise.resolve(transportConfig().handlers.open?.(connection, context)).then(() => {
      opened = true
    })
    await new Promise((resolve) => setImmediate(resolve))

    expect(opened).toBe(false)
  })

  // Reference defect 2: the access token leaked through console.log
  it('does not log the access token', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    try {
      mockToken()

      await connect()
      handleMessage([{ T: 'error', code: 402, msg: 'auth failed' }])

      const logged = loggedText(logger) + JSON.stringify(consoleLog.mock.calls)
      expect(logged).not.toContain(ACCESS_TOKEN)
      expect(logged).not.toContain(CLIENT_SECRET)
    } finally {
      consoleLog.mockRestore()
    }
  })
})

// Spec stock_quotes description: {"action":"subscribe","quotes":["AAPL","SPY"]}; overrides identity
describe('subscription builders', () => {
  // Reference defect 3: test and implementation must agree on this exact frame. The literal spec
  // frames anchor the shared formats the other tests import from the transport.
  it('subscribe message shape matches spec', () => {
    expect(subscribeMessage('AAPL')).toEqual({ action: 'subscribe', quotes: ['AAPL'] })
    expect(unsubscribeMessage('AAPL')).toEqual({ action: 'unsubscribe', quotes: ['AAPL'] })
    expect(authMessage('tok')).toEqual({ action: 'auth', key: 'access_token', secret: 'tok' })
  })

  it('builds subscribe message {action:subscribe,quotes:[AAPL]}', () => {
    expect(subscribe(params())).toEqual(subscribeMessage('AAPL'))
  })

  it('unsubscribe message is {action:unsubscribe,quotes:[AAPL]}', () => {
    subscribe(params())

    expect(unsubscribe(params())).toEqual(unsubscribeMessage('AAPL'))
  })

  it('keeps BRK.B dot suffix', () => {
    expect(subscribe(params({ base: 'BRK.B' }))).toEqual(subscribeMessage('BRK.B'))
  })

  it('subscribes the uppercase provider symbol for a lowercase base', () => {
    expect(subscribe(params({ base: 'aapl' }))).toEqual(subscribeMessage('AAPL'))
  })

  // Spec base: class shares use a dot suffix (BRK.B); sample_response S is uppercase. The transport
  // owns case normalization now that the endpoint has no request transform.
  it('lowercase base maps to uppercase provider symbol', () => {
    expect(subscribe(params({ base: 'brk.b' }))).toEqual(subscribeMessage('BRK.B'))
  })

  // One provider subscription per symbol: subscribe on the first variant only, unsubscribe on the
  // last variant only
  it('returns subscribe on first add and unsubscribe only on last remove', () => {
    const lenient = params()
    const strict = params({ requireVolume: true })

    expect(subscribe(lenient)).toEqual(subscribeMessage('AAPL'))
    expect(subscribe(strict)).toBeUndefined()

    expect(unsubscribe(lenient)).toBeUndefined()
    expect(unsubscribe(strict)).toEqual(unsubscribeMessage('AAPL'))
  })

  // Plan: a variant that expires in the same background run that a new variant is added keeps the
  // provider subscription, and the new variant receives quotes
  it('swaps variants of one symbol in one background run', () => {
    const oldVariant = params({ requireVolume: false })
    const newVariant = params({ requireVolume: true })
    subscribe(oldVariant)

    expect(subscribe(newVariant)).toBeUndefined()
    expect(unsubscribe(oldVariant)).toBeUndefined()

    const results = handleMessage([quote()])
    const entry = results.find((r) => r.params.requireVolume && !r.params.isOvernight)
    expect(entry?.params).toEqual(newVariant)
    expect(entry?.response.data?.mid_price).toBe(190.0)
  })

  // Plan: one quote already writes every variant, so a variant added after the quote is served
  // from cache without a new provider frame
  it('new param variant of a subscribed symbol is served without a new provider frame', () => {
    subscribe(params())
    const results = handleMessage([quote()])

    expect(subscribe(params({ requireVolume: true }))).toBeUndefined()
    expect(subscribe(params({ isOvernight: true }))).toBeUndefined()
    expect(results.map((r) => r.params)).toEqual(
      expect.arrayContaining([params({ requireVolume: true }), params({ isOvernight: true })]),
    )
    results.forEach((r) => expect(r.response.data?.mid_price).toBe(190.0))
  })

  it('unsubscribe of the last variant stops results for the symbol', () => {
    subscribe(params())
    unsubscribe(params())

    expect(handleMessage([quote()])).toEqual([])
  })
})

describe('message handler', () => {
  // Reference defect 5: frames arrive as arrays that can carry several events
  it('handles a multi-event array frame', () => {
    subscribe(params({ base: 'SPY' }))
    subscribe(params({ base: 'QQQ' }))

    const results = defaultVariant(
      handleMessage([quote({ S: 'SPY', bp: 500, ap: 501 }), quote({ S: 'QQQ', bp: 400, ap: 402 })]),
    )

    expect(results.map((r) => [r.params.base, r.response.result])).toEqual([
      ['SPY', 500.5],
      ['QQQ', 401],
    ])
  })

  // Plan round1-ws-subscribe-and-frames: one array mixing control, error and quote events yields
  // exactly one result per q item
  it('mixed success, subscription, error and q array -> one result per q item', () => {
    subscribe(params())
    subscribe(params({ base: 'SPY' }))

    const results = defaultVariant(
      handleMessage([
        { T: 'success', msg: 'authenticated' },
        { T: 'subscription', trades: [], quotes: ['AAPL', 'SPY'], bars: [] },
        { T: 'error', code: 405, msg: 'symbol limit exceeded' },
        quote(),
        quote({ S: 'SPY', bp: 500, ap: 501 }),
      ]),
    )

    expect(results).toHaveLength(2)
    expect(results[0].params.base).toBe('AAPL')
    expect(results[0].response.result).toBe(190.0)
    expect(results[1].params.base).toBe('SPY')
    expect(results[1].response.result).toBe(500.5)
    expect(JSON.stringify(logger.warn.mock.calls)).toContain('405')
  })

  // Spec sample_response control frames, error frames, and trades (delayed and adjusted on this
  // feed, so not used)
  it('ignores non-q events', () => {
    subscribe(params())

    expect(
      handleMessage([
        { T: 'success', msg: 'connected' },
        { T: 'success', msg: 'authenticated' },
        { T: 'subscription', trades: [], quotes: ['AAPL'], bars: [] },
        { T: 'error', code: 400, msg: 'invalid syntax' },
        { T: 't', S: 'AAPL', p: 999, s: 10, t: '2026-09-17T00:30:15Z' },
      ]),
    ).toEqual([])
  })

  // Plan round1-error-frames: an error frame writes no cache entry, never throws, and is logged with
  // its code and msg at warn level
  it('T=error frame produces no cache entry and does not throw', () => {
    subscribe(params())

    let results: Result[] = []
    expect(() => {
      results = handleMessage([{ T: 'error', code: 409, msg: 'insufficient subscription' }])
    }).not.toThrow()

    expect(results).toEqual([])
    const warned = JSON.stringify(logger.warn.mock.calls)
    expect(warned).toContain('409')
    expect(warned).toContain('insufficient subscription')
  })

  // A burst of bad quotes must not flood the logs on the message hot path
  it('logs dropped quotes at debug level', () => {
    subscribe(params())
    handleMessage([quote({ t: T2 })])
    clearLogs(logger)

    expect(handleMessage([quote({ t: T1 })])).toEqual([])
    expect(logger.debug).toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })
})

// Spec response_mapping and endpoint_request_response_examples[0]; owner decisions
// one_sided_semantics=match_reference (zero side reports as-is, mid uses the other side) and
// wire_timestamp=provider_indicated_from_t
describe('quote parsing', () => {
  const parseDefault = (frame: Record<string, unknown>) => {
    subscribe(params())
    return defaultVariant(handleMessage([frame]))
  }

  it('two-sided quote gives mid 190.0 for bp 189.95 ap 190.05', () => {
    const [result] = parseDefault(quote())

    expect(result.params).toEqual(params())
    expect(result.response).toEqual({
      data: {
        mid_price: 190.0,
        bid_price: 189.95,
        bid_volume: 1,
        ask_price: 190.05,
        ask_volume: 2,
      },
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: WIRE_INPUT_TIME_MS },
    })
  })

  it('t 2026-09-17T00:30:15.123456789Z gives providerIndicatedTimeUnixMs 1789605015123', () => {
    const [result] = parseDefault(quote({ t: '2026-09-17T00:30:15.123456789Z' }))

    expect(result.response).toHaveProperty('timestamps.providerIndicatedTimeUnixMs', 1789605015123)
  })

  // Owner decision one_sided_semantics=match_reference: the zero side reports as-is (no null), mid
  // takes the other side
  it('one-sided bid gives mid=bid', () => {
    const [result] = parseDefault(quote({ ap: 0, as: 0 }))

    expect(result.response.result).toBe(189.95)
    expect(result.response.data).toEqual({
      mid_price: 189.95,
      bid_price: 189.95,
      bid_volume: 1,
      ask_price: 0,
      ask_volume: 0,
    })
  })

  it('one-sided ask gives mid=ask', () => {
    const [result] = parseDefault(quote({ bp: 0, bs: 0 }))

    expect(result.response.result).toBe(190.05)
    expect(result.response.data).toEqual({
      mid_price: 190.05,
      bid_price: 0,
      bid_volume: 0,
      ask_price: 190.05,
      ask_volume: 2,
    })
  })

  // Spec wind_down_frames: drop_if_both_sides_zero
  it('both zero -> no response written', () => {
    subscribe(params())

    expect(handleMessage([quote({ bp: 0, bs: 0, ap: 0, as: 0 })])).toEqual([])
  })
})

// Plan (dxfeed mechanism): one quote writes all 4 requireVolume x isOvernight variants, so one
// subscription keyed by base serves every variant
describe('param variant fan-out', () => {
  const VARIANTS = [
    { requireVolume: false, isOvernight: false },
    { requireVolume: true, isOvernight: false },
    { requireVolume: false, isOvernight: true },
    { requireVolume: true, isOvernight: true },
  ]

  const entryFor = (results: Result[], v: (typeof VARIANTS)[number]) =>
    results.filter(
      (r) => r.params.requireVolume === v.requireVolume && r.params.isOvernight === v.isOvernight,
    )

  it('writes responses for all four requireVolume/isOvernight variants from one quote', () => {
    subscribe(params())

    const results = handleMessage([quote()])

    expect(results).toHaveLength(4)
    VARIANTS.forEach((v) => {
      const [entry] = entryFor(results, v)
      expect(entry.params).toEqual(params(v))
      expect(entry.response.result).toBe(190.0)
      expect(entry.response.data).toEqual({
        mid_price: 190.0,
        bid_price: 189.95,
        bid_volume: 1,
        ask_price: 190.05,
        ask_volume: 2,
      })
    })
  })

  // Spec requireVolume: error if bid/ask volume is invalid (dxfeed compat, 502)
  it.each([
    ['bs missing', { bs: undefined }],
    ['as missing', { as: undefined }],
    ['bs not a number', { bs: 'x' }],
  ])('requireVolume=true with missing volume gives 502 (%s)', (_, fields) => {
    subscribe(params())

    const results = handleMessage([quote(fields)])

    expect(results).toHaveLength(4)
    VARIANTS.forEach((v) => {
      const [entry] = entryFor(results, v)
      if (v.requireVolume) {
        expect(entry.response).toMatchObject({ statusCode: 502, errorMessage: expect.any(String) })
      } else {
        expect(entry.response.result).toBe(190.0)
      }
    })
  })

  // Spec isOvernight: accepted, no-op on Alpaca overnight frames (exchange 'B')
  it('isOvernight=true does not filter exchange B', () => {
    subscribe(params({ isOvernight: true }))

    const results = handleMessage([quote({ bx: 'B', ax: 'B' })])
    const [overnight] = entryFor(results, { requireVolume: false, isOvernight: true })

    expect(overnight.response.result).toBe(190.0)
    expect(overnight.response.data?.mid_price).toBe(190.0)
  })
})

describe('connection lifecycle', () => {
  // Owner decision reconnect_backoff=cut: the framework owns reconnects, so the transport adds no
  // close/error hook and overrides none of the framework connection methods
  it('transport defines no custom reconnect handler', () => {
    expect(transportConfig().handlers.close).toBeUndefined()
    expect(transportConfig().handlers.error).toBeUndefined()

    const frameworkMethods = [
      'streamHandler',
      'establishWsConnection',
      'buildConnectionHandlers',
      'connectionClosed',
    ]
    const overridden = frameworkMethods.filter((method) =>
      Object.prototype.hasOwnProperty.call(StockQuotesTransport.prototype, method),
    )
    expect(overridden).toEqual([])
  })

  // Plan: a reconnect keeps the last accepted t, so an older replayed quote cannot overwrite a newer
  // cached one
  it('reconnect does not regress to an older quote', async () => {
    mockToken()
    subscribe(params())
    expect(defaultVariant(handleMessage([quote({ t: T2 })]))).toHaveLength(1)

    await connect()
    // The framework resubscribes the desired subscriptions after open
    subscribe(params())

    expect(handleMessage([quote({ t: T1, bp: 380, ap: 382 })])).toEqual([])
    const [newer] = defaultVariant(handleMessage([quote({ t: T3, bp: 200, ap: 202 })]))
    expect(newer.response.result).toBe(201)
  })

  // Spec data_freshness timestamp_field t: a late quote for an unsubscribed symbol leaves no time
  // behind that would drop quotes after a resubscribe
  it('a quote after the last unsubscribe does not block quotes after a resubscribe', () => {
    subscribe(params())
    handleMessage([quote({ t: T1 })])
    unsubscribe(params())

    expect(handleMessage([quote({ t: T3 })])).toEqual([])

    subscribe(params())
    const [result] = handleMessage([quote({ t: T2, bp: 200, ap: 202 })])
    expect(result.response.result).toBe(201)
  })
})
