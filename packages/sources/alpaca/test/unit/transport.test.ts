import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocket } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { EventEmitter } from 'events'
import {
  authenticate,
  authMessage,
  StockQuotesTransport,
  subscribeMessage,
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

// Unsubscribe frame, mirroring the spec subscribe format; the builder is module-local in src
const unsubscribeMessage = (symbol: string) => ({ action: 'unsubscribe', quotes: [symbol] })

// Spec example request {"from":"AAPL","to":"USD"} after validation: both flags at spec default false
const params = (overrides: Partial<Params> = {}): Params => ({
  base: 'AAPL',
  quote: 'USD',
  requireVolume: false,
  isOvernight: false,
  ...overrides,
})

// Spec wire_input with overrides
const quote = (overrides: Record<string, unknown> = {}) => ({ ...WIRE_INPUT, ...overrides })

// Spec endpoint_request_response_examples[0].response.data
const SPEC_DATA = {
  mid_price: 190.0,
  bid_price: 189.95,
  bid_volume: 1,
  ask_price: 190.05,
  ask_volume: 2,
}

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

// The result written for one (requireVolume, isOvernight) variant of AAPL
const entryFor = (results: Result[], v: Partial<Params>) => {
  const p = params(v)
  return results.find(
    (r) =>
      r.params.base === p.base &&
      r.params.requireVolume === p.requireVolume &&
      r.params.isOvernight === p.isOvernight,
  )
}

// Provider error frames are logged at warn or error level
const errorFrameLogs = () => JSON.stringify([logger.warn.mock.calls, logger.error.mock.calls])

const subscribe = (p: Params) => transportConfig().builders?.subscribeMessage?.(p as never, context)
const unsubscribe = (p: Params) =>
  transportConfig().builders?.unsubscribeMessage?.(p as never, context)

// Socket over an EventEmitter that answers nothing; the test emits frames or close itself
const emitterSocket = () => {
  const emitter = new EventEmitter()
  type Listener = (...args: unknown[]) => void
  const socket = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: (type: string, l: Listener) => emitter.on(type, l),
    removeEventListener: (type: string, l: Listener) => emitter.off(type, l),
    on: (type: string, l: Listener) => emitter.on(type, l),
    once: (type: string, l: Listener) => emitter.once(type, l),
    off: (type: string, l: Listener) => emitter.off(type, l),
    removeListener: (type: string, l: Listener) => emitter.off(type, l),
  } as unknown as WebSocket
  return { emitter, socket }
}

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

  // A socket that closes before the authenticated frame must settle the auth wait and leave no
  // listener behind; the rejection never carries the token
  it('authenticate rejects and removes listeners when the socket closes before authenticated', async () => {
    const { emitter, socket } = emitterSocket()

    const pending = authenticate(socket, ACCESS_TOKEN)
    emitter.emit('close', { code: 1006, reason: '' })
    const error = await pending.then(
      () => undefined,
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain(ACCESS_TOKEN)
    expect(emitter.listenerCount('message')).toBe(0)
    expect(emitter.listenerCount('close')).toBe(0)
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

  // Spec base: class shares use a dot suffix (BRK.B); sample_response S is uppercase
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

  // A variant that expires in the same background run that a new variant is added keeps the
  // provider subscription, and only the new variant receives quotes
  it('swaps variants of one symbol in one background run', () => {
    const oldVariant = params({ requireVolume: false })
    const newVariant = params({ requireVolume: true })
    subscribe(oldVariant)

    expect(subscribe(newVariant)).toBeUndefined()
    expect(unsubscribe(oldVariant)).toBeUndefined()

    const results = handleMessage([quote()])
    expect(results).toHaveLength(1)
    expect(results[0].params).toEqual(newVariant)
    expect(results[0].response.data?.mid_price).toBe(190.0)
  })

  // A new variant shares the existing provider subscription and is served by the next quote
  it('new param variant of a subscribed symbol is served by the next quote', () => {
    subscribe(params())
    handleMessage([quote({ t: T1 })])

    expect(subscribe(params({ requireVolume: true }))).toBeUndefined()

    const entry = entryFor(handleMessage([quote({ t: T2 })]), { requireVolume: true })
    expect(entry?.params).toEqual(params({ requireVolume: true }))
    expect(entry?.response.data?.mid_price).toBe(190.0)
  })

  it('unsubscribe of the last variant stops results for the symbol', () => {
    subscribe(params())
    unsubscribe(params())

    expect(handleMessage([quote()])).toEqual([])
  })
})

describe('message handler', () => {
  // Reference defect 5: frames arrive as arrays that can carry several events
  it('message handler processes each quote in a multi-element array frame', () => {
    subscribe(params({ base: 'SPY' }))
    subscribe(params({ base: 'QQQ' }))

    const results = handleMessage([
      quote({ S: 'SPY', bp: 500, ap: 501 }),
      quote({ S: 'QQQ', bp: 400, ap: 402 }),
    ])

    expect(results.map((r) => [r.params.base, r.response.result])).toEqual([
      ['SPY', 500.5],
      ['QQQ', 401],
    ])
  })

  // One array mixing control, error and quote events yields exactly one result per q item
  it('mixed success, subscription, error and q array -> one result per q item', () => {
    subscribe(params())
    subscribe(params({ base: 'SPY' }))

    const results = handleMessage([
      { T: 'success', msg: 'authenticated' },
      { T: 'subscription', trades: [], quotes: ['AAPL', 'SPY'], bars: [] },
      { T: 'error', code: 405, msg: 'symbol limit exceeded' },
      quote(),
      quote({ S: 'SPY', bp: 500, ap: 501 }),
    ])

    expect(results).toHaveLength(2)
    expect(results[0].params.base).toBe('AAPL')
    expect(results[0].response.result).toBe(190.0)
    expect(results[1].params.base).toBe('SPY')
    expect(results[1].response.result).toBe(500.5)
    expect(errorFrameLogs()).toContain('405')
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

  // An error frame writes no cache entry, never throws, and is logged with its code and msg
  it('T=error frame produces no cache entry and does not throw', () => {
    subscribe(params())

    let results: Result[] = []
    expect(() => {
      results = handleMessage([{ T: 'error', code: 409, msg: 'insufficient subscription' }])
    }).not.toThrow()

    expect(results).toEqual([])
    expect(errorFrameLogs()).toContain('409')
    expect(errorFrameLogs()).toContain('insufficient subscription')
  })

  it('frame with non-string S produces no results', () => {
    subscribe(params())

    expect(handleMessage([quote({ S: 123 })])).toEqual([])
  })

  // A burst of stale quotes must not flood the logs on the message hot path
  it('logs dropped quotes at debug level', () => {
    subscribe(params())
    handleMessage([quote({ t: T2 })])
    clearLogs(logger)

    expect(handleMessage([quote({ t: T1 })])).toEqual([])
    expect(logger.debug).toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  // Owner decision wire_timestamp=provider_indicated_from_t: no t, no response. Field presence on
  // the overnight feed is not wire-verified, so every drop is visible at warn level.
  it('quote without t is dropped and warns on each drop', () => {
    subscribe(params())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t: _t, ...withoutT } = quote()

    expect(handleMessage([withoutT])).toEqual([])
    expect(handleMessage([withoutT])).toEqual([])

    expect(logger.warn).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(logger.warn.mock.calls)).toContain('AAPL')
  })
})

// Spec response_mapping and endpoint_request_response_examples[0]; owner decisions
// one_sided_semantics=match_reference (zero side reports as-is, mid uses the other side) and
// wire_timestamp=provider_indicated_from_t
describe('quote parsing', () => {
  const parseDefault = (frame: Record<string, unknown>) => {
    subscribe(params())
    return handleMessage([frame])
  }

  it('two-sided quote gives mid 190.0 with bid/ask/volumes as-is', () => {
    const [result] = parseDefault(quote())

    expect(result.params).toEqual(params())
    expect(result.response).toEqual({
      data: SPEC_DATA,
      result: 190.0,
      timestamps: { providerIndicatedTimeUnixMs: WIRE_INPUT_TIME_MS },
    })
  })

  it('nanosecond t parses to providerIndicatedTimeUnixMs 1789605015123', () => {
    const [result] = parseDefault(quote({ t: '2026-09-17T00:30:15.123456789Z' }))

    expect(result.response).toHaveProperty('timestamps.providerIndicatedTimeUnixMs', 1789605015123)
  })

  // Owner decision wire_timestamp=provider_indicated_from_t: a quote without a valid t is dropped
  it('unparseable t writes no response', () => {
    expect(parseDefault(quote({ t: 'not-a-time' }))).toEqual([])
  })

  it('ask 0 gives mid=bid', () => {
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

  it('bid 0 gives mid=ask', () => {
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
  it('both sides 0 writes no response', () => {
    expect(parseDefault(quote({ bp: 0, bs: 0, ap: 0, as: 0 }))).toEqual([])
  })
})

// Spec requireVolume / isOvernight (default false, domain [false, true]). One provider subscription
// per symbol serves every subscribed variant, and each quote writes only the subscribed variants.
describe('subscribed variant results', () => {
  it('handleQuote emits results only for subscribed variants', () => {
    subscribe(params({ requireVolume: true }))

    const results = handleMessage([quote()])

    expect(results).toHaveLength(1)
    expect(results[0].params).toEqual({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: true,
      isOvernight: false,
    })
    expect(results[0].response.result).toBe(190.0)
  })

  it('writes one result per subscribed requireVolume/isOvernight pair from one quote', () => {
    const PAIRS = [false, true].flatMap((isOvernight) =>
      [false, true].map((requireVolume) => ({ requireVolume, isOvernight })),
    )
    PAIRS.forEach((v) => subscribe(params(v)))

    const results = handleMessage([quote()])

    expect(results).toHaveLength(4)
    PAIRS.forEach((v) => {
      const entry = entryFor(results, v)
      expect(entry?.params).toEqual(params(v))
      expect(entry?.response.result).toBe(190.0)
      expect(entry?.response.data).toEqual(SPEC_DATA)
    })
  })

  // Spec requireVolume: error if bid/ask volume is invalid (dxfeed compat, 502); false stays lenient
  it.each([
    ['bs missing', { bs: undefined }],
    ['as missing', { as: undefined }],
    ['bs not a number', { bs: 'x' }],
  ])('invalid volume: only requireVolume=true gives 502 (%s)', (_, fields) => {
    subscribe(params())
    subscribe(params({ requireVolume: true }))

    const results = handleMessage([quote(fields)])

    expect(results).toHaveLength(2)
    expect(entryFor(results, { requireVolume: true })?.response).toMatchObject({
      statusCode: 502,
      errorMessage: expect.any(String),
    })
    expect(entryFor(results, { requireVolume: false })?.response.result).toBe(190.0)
  })

  // dxfeed reference: an invalid volume (NaN) is a 502 under requireVolume=true; a zero volume is a
  // valid one-sided book (owner decision one_sided_semantics=match_reference). The 502 text is fixed:
  // provider-supplied volume text never reaches the error message.
  it('requireVolume=true with an invalid volume returns 502 with the fixed dxfeed message', () => {
    subscribe(params({ requireVolume: true }))
    const strictEntry = (results: Result[]) =>
      entryFor(results, { requireVolume: true })?.response as {
        statusCode?: number
        errorMessage?: string
      }

    const first = strictEntry(handleMessage([quote({ bs: 'x\nFAKE LOG ENTRY' })]))
    const second = strictEntry(handleMessage([quote({ as: { injected: 'FAKE OBJECT' } })]))

    expect(first.statusCode).toBe(502)
    expect(second.statusCode).toBe(502)
    expect(first.errorMessage).toEqual(expect.any(String))
    expect(first.errorMessage).toBe(second.errorMessage)
    expect(first.errorMessage).not.toContain('FAKE LOG ENTRY')
    expect(first.errorMessage).not.toContain('\n')
    expect(second.errorMessage).not.toContain('FAKE OBJECT')

    const zeroVolume = entryFor(handleMessage([quote({ ap: 0, as: 0 })]), { requireVolume: true })
    expect(zeroVolume?.response.result).toBe(189.95)
  })

  // Spec isOvernight: accepted, no-op on Alpaca overnight frames (exchange 'B')
  it('isOvernight=true does not filter exchange B', () => {
    subscribe(params({ isOvernight: true }))

    const overnight = entryFor(handleMessage([quote({ bx: 'B', ax: 'B' })]), { isOvernight: true })

    expect(overnight?.response.result).toBe(190.0)
    expect(overnight?.response.data?.mid_price).toBe(190.0)
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

  // The cache outlives the connection, so the open handler keeps the provider times
  it('open keeps latestQuotes from the previous connection', async () => {
    mockToken()
    subscribe(params())
    handleMessage([quote()])
    expect(transport.latestQuotes.size).toBe(1)

    await connect()

    expect(transport.latestQuotes.size).toBe(1)
  })

  it('serves quotes after a reconnect', async () => {
    mockToken()
    subscribe(params())
    expect(handleMessage([quote({ t: T2 })])).toHaveLength(1)

    await connect()
    // The framework resubscribes the desired subscriptions after open
    subscribe(params())

    const [newer] = handleMessage([quote({ t: T3, bp: 200, ap: 202 })])
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

// The transport must not depend on the endpoint module at runtime: with the old circular import,
// loading one module first left the other's export undefined while it was being built
describe('module load order', () => {
  const DEFAULT_TRANSPORT = 'default_single_transport'
  /* eslint-disable @typescript-eslint/no-var-requires */
  const loadTransport = () => require('../../src/transport/stock_quotes')
  const loadEndpoint = () => require('../../src/endpoint/stock_quotes')
  /* eslint-enable @typescript-eslint/no-var-requires */

  it('loads the transport module first with wsTransport defined and wired into the endpoint', () => {
    jest.isolateModules(() => {
      const { wsTransport } = loadTransport()
      const { endpoint } = loadEndpoint()

      expect(wsTransport).toBeDefined()
      expect(endpoint.transportRoutes.get(DEFAULT_TRANSPORT)).toBe(wsTransport)
    })
  })

  it('loads the endpoint module first with its transport defined', () => {
    jest.isolateModules(() => {
      const { endpoint } = loadEndpoint()
      const { wsTransport } = loadTransport()

      expect(wsTransport).toBeDefined()
      expect(endpoint.transportRoutes.get(DEFAULT_TRANSPORT)).toBe(wsTransport)
    })
  })
})
