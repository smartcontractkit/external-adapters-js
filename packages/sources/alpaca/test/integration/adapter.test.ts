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
  ACCESS_TOKEN,
  AUTH_ENDPOINT,
  CLIENT_ID,
  CLIENT_SECRET,
  NO_BID_VOLUME_QUOTE,
  WS_API_ENDPOINT,
  mockTokenResponse,
  mockWebsocketServer,
  pushFrames,
  subscribeMessage,
} from './fixtures'

// Spec endpoint_request_response_examples[0]
const exampleRequest = { from: 'AAPL', to: 'USD' }
const exampleResponse = {
  data: {
    mid_price: 190.0,
    bid_price: 189.95,
    bid_volume: 1,
    ask_price: 190.05,
    ask_volume: 2,
  },
  result: 190.0,
  statusCode: 200,
  timestamps: {
    providerIndicatedTimeUnixMs: 1789605015123,
  },
}

// Spec refresh_policy per_connect: the token endpoint issues a different token per exchange, so a
// reconnect that reuses the earlier connection's token is visible in the auth frame
const SECOND_ACCESS_TOKEN = 'fake-access-token-2'
const ISSUED_TOKENS = [ACCESS_TOKEN, SECOND_ACCESS_TOKEN]

// Captured before FakeTimers.install replaces the global
const realSetTimeout = setTimeout

describe('stock_quotes websocket', () => {
  let testAdapter: TestAdapter
  let mockWsServer: MockWebsocketServer | undefined
  let oldEnv: NodeJS.ProcessEnv
  const received: { action?: string; key?: string; secret?: string; quotes?: string[] }[] = []
  const tokenBodies: string[] = []
  let tokenScope: nock.Scope

  // nock replies on a real timer, so each step also yields real time
  const step = async () => {
    await testAdapter.clock.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  // A new param variant is a new subscription: poll until it leaves the 504 "not yet cached" state
  const requestUntilCached = async (params: Record<string, unknown>) => {
    let response = await testAdapter.request(params)
    for (let i = 0; i < 10 && response.statusCode === 504; i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  // A new param variant of an already subscribed symbol shares its provider subscription, so it is
  // served from the next quote the provider sends: register the variant, then push that quote
  const requestNewVariant = async (params: Record<string, unknown>, frame: object) => {
    await testAdapter.request(params)
    await step()
    pushFrames([frame])
    return requestUntilCached(params)
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CLIENT_ID'] = CLIENT_ID
    process.env['CLIENT_SECRET'] = CLIENT_SECRET
    // The spec defines no API_KEY: the adapter must boot on the OAuth client credentials alone
    delete process.env['API_KEY']
    // Spec environment_variables (sandbox defaults)
    process.env['AUTH_ENDPOINT'] = AUTH_ENDPOINT
    process.env['WS_API_ENDPOINT'] = WS_API_ENDPOINT

    tokenScope = mockTokenResponse((body) => tokenBodies.push(body), ISSUED_TOKENS)

    mockWebSocketProvider(WebSocketClassProvider)
    // The fixture server sends an error frame before the spec AAPL quote frame (both JSON arrays)
    mockWsServer = mockWebsocketServer(WS_API_ENDPOINT, received, ISSUED_TOKENS)

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-09-17T00:31:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request(exampleRequest)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    nock.cleanAll()
    nock.restore()
  })

  // The framework meta block (present only with metrics on) is not part of the spec body
  const expectSpecExample = (json: Record<string, unknown>) => {
    const body = { ...json }
    delete body['meta']
    expect(body).toEqual({
      ...exampleResponse,
      timestamps: {
        ...exampleResponse.timestamps,
        providerDataStreamEstablishedUnixMs: expect.any(Number),
        providerDataReceivedUnixMs: expect.any(Number),
      },
    })
  }

  // The fixture server sends a T=error frame before the quote, so this also proves the adapter
  // survives an error frame
  it('returns mid 190.0, bid 189.95/1, ask 190.05/2, providerIndicatedTimeUnixMs 1789605015123 for AAPL/USD', async () => {
    const response = await testAdapter.request(exampleRequest)
    expect(response.statusCode).toBe(200)
    expectSpecExample(response.json())
  })

  describe('auth', () => {
    // Spec data_source_authentication: the token exchange runs before the stream serves data
    it('hits AUTH_ENDPOINT on the first request', () => {
      expect(tokenScope.isDone()).toBe(true)
    })

    // Spec token_request body parameters
    it('requests token with form-encoded client credentials', () => {
      expect(tokenBodies.length).toBeGreaterThanOrEqual(1)
      expect(Object.fromEntries(new URLSearchParams(tokenBodies[0]))).toEqual({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      })
    })

    // Spec token_usage.ws_auth_message, sent before any subscribe; refresh_policy per_connect
    it('sends auth message with access token then subscribe {action:subscribe,quotes:[AAPL]}', () => {
      expect(tokenBodies).toHaveLength(1)
      expect(received[0]).toEqual({ action: 'auth', key: 'access_token', secret: ACCESS_TOKEN })
      const firstSubscribe = received.findIndex((m) => m.action === 'subscribe')
      expect(firstSubscribe).toBeGreaterThan(0)
      expect(received[firstSubscribe]).toEqual(subscribeMessage('AAPL'))
    })
  })

  describe('subscribe', () => {
    // Spec subscribe format {"action":"subscribe","quotes":[...]}
    it('sends subscribe frame {action:subscribe,quotes:[AAPL]}', () => {
      expect(received).toContainEqual(subscribeMessage('AAPL'))
    })

    // Spec: class shares keep the dot suffix (BRK.B, not BRK/B); symbol/market are base/quote aliases
    it('accepts {symbol:BRK.B,market:USD} and subscribes BRK.B', async () => {
      await testAdapter.request({ symbol: 'BRK.B', market: 'USD' })
      for (let i = 0; i < 10 && !JSON.stringify(received).includes('BRK.B'); i++) {
        await step()
      }
      expect(received).toContainEqual(subscribeMessage('BRK.B'))
    })

    // Spec overrides: identity by default (AAPL subscribes as AAPL, asserted above). A request-level
    // override still maps the provider symbol.
    it('overrides param maps AAPL->AAPL.X subscription when supplied in request', async () => {
      await testAdapter.request({
        base: 'AAPL',
        quote: 'USD',
        overrides: { alpaca: { AAPL: 'AAPL.X' } },
      })
      for (let i = 0; i < 10 && !JSON.stringify(received).includes('AAPL.X'); i++) {
        await step()
      }
      expect(received).toContainEqual(subscribeMessage('AAPL.X'))
    })

    // Spec sample_response: Alpaca symbols are uppercase (S: "AAPL"), class shares use a dot suffix
    // (BRK.B). A lowercase base and a lowercase override target both reach the provider uppercase
    // and are served from the quote frame for that uppercase symbol.
    it('lowercase base and lowercase override map both subscribe with uppercase ticker', async () => {
      const brkQuote = { ...AAPL_QUOTE, S: 'BRK.B', bp: 480, bs: 3, ap: 482, as: 4 }

      const aapl = await requestNewVariant({ from: 'aapl', to: 'USD' }, AAPL_QUOTE)
      const brk = await requestNewVariant(
        { base: 'BERKB', quote: 'USD', overrides: { alpaca: { BERKB: 'brk.b' } } },
        brkQuote,
      )

      const subscribes = received.filter((m) => m.action === 'subscribe')
      expect(subscribes).toContainEqual(subscribeMessage('AAPL'))
      expect(subscribes).toContainEqual(subscribeMessage('BRK.B'))
      for (const frame of subscribes) {
        for (const symbol of frame.quotes ?? []) {
          expect(symbol).toBe(symbol.toUpperCase())
        }
      }

      expect(aapl.statusCode).toBe(200)
      expectSpecExample(aapl.json())
      expect(brk.statusCode).toBe(200)
      expect(brk.json()).toMatchObject({
        result: 481,
        data: { mid_price: 481, bid_price: 480, bid_volume: 3, ask_price: 482, ask_volume: 4 },
      })
    })
  })

  describe('stock_quotes endpoint', () => {
    // Spec endpoint_request_response_examples[0] uses the from/to aliases and no endpoint field, so
    // stock_quotes must be the default endpoint
    it('accepts from/to aliases', async () => {
      const response = await testAdapter.request(exampleRequest)
      expect(response.statusCode).toBe(200)
      expectSpecExample(response.json())
    })

    // Spec input_parameters: isOvernight is a no-op on Alpaca overnight frames (exchange 'B')
    it('isOvernight=true returns same data', async () => {
      const overnight = await requestNewVariant(
        { ...exampleRequest, isOvernight: true },
        AAPL_QUOTE,
      )
      const regular = await testAdapter.request({ ...exampleRequest, isOvernight: false })
      expect(overnight.statusCode).toBe(200)
      expect(regular.statusCode).toBe(200)
      expectSpecExample(overnight.json())
      expect(overnight.json().data).toEqual(regular.json().data)
      expect(overnight.json().result).toEqual(regular.json().result)
    })

    // Spec input_parameters: requireVolume is a boolean (default false, dxfeed compat). A JSON true
    // passes input validation, and the spec AAPL frame has valid volumes (bs 1, as 2), so it returns
    // the spec example.
    it('requireVolume=true with valid volumes returns 200 with the spec example', async () => {
      const response = await requestNewVariant(
        { base: 'AAPL', quote: 'USD', requireVolume: true },
        AAPL_QUOTE,
      )
      expect(response.statusCode).toBe(200)
      expectSpecExample(response.json())
    })

    // Spec input_parameters: requireVolume and isOvernight both default false with "If true"
    // semantics (dxfeed compat), so dxfeed consumers send JSON booleans. Both set to true together
    // must pass input validation and return the spec example (AAPL frame has valid volumes).
    it('stock_quotes accepts requireVolume=true and isOvernight=true as booleans', async () => {
      const response = await requestNewVariant(
        { endpoint: 'stock_quotes', ...exampleRequest, requireVolume: true, isOvernight: true },
        AAPL_QUOTE,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json().data.mid_price).toBe(190.0)
      expectSpecExample(response.json())
    })

    // Spec input_parameters: requireVolume=true errors when bid/ask volume is invalid (dxfeed: 502).
    // The NOVL fixture frame has no `bs` field.
    it('requireVolume=true with missing volume returns 502', async () => {
      const response = await requestUntilCached({
        base: 'NOVL',
        quote: 'USD',
        requireVolume: true,
      })
      expect(response.statusCode).toBe(502)
    })

    // Spec input_parameters: requireVolume defaults to false (a boolean). An explicit JSON false
    // must keep the lenient path: the same volume-less quote still returns the (bp + ap) / 2 mid.
    it('requireVolume=false with a missing bid volume returns 200 with the mid price', async () => {
      const response = await requestNewVariant(
        { base: 'NOVL', quote: 'USD', requireVolume: false },
        NO_BID_VOLUME_QUOTE,
      )
      expect(response.statusCode).toBe(200)
      expect(response.json().data).toMatchObject({
        mid_price: 190.0,
        bid_price: 189.95,
        ask_price: 190.05,
      })
    })

    // Spec endpoints[0]: a dxfeed stock_quotes drop-in. Alias and flag variants of one base share one
    // provider subscription (one subscribe frame per connection), and each gets the spec example.
    it('serves from/to, requireVolume and symbol/market+isOvernight variants from one AAPL subscription', async () => {
      const variants = [
        exampleRequest,
        { base: 'AAPL', quote: 'USD', requireVolume: true },
        { symbol: 'AAPL', market: 'USD', isOvernight: true },
      ]
      for (const params of variants) {
        const response = await requestNewVariant(params, AAPL_QUOTE)
        expect(response.statusCode).toBe(200)
        expectSpecExample(response.json())
      }

      const aaplSubscribes = received.filter(
        (m) => m.action === 'subscribe' && m.quotes?.includes('AAPL'),
      )
      const connections = received.filter((m) => m.action === 'auth').length
      expect(aaplSubscribes).toHaveLength(connections)
      for (const frame of aaplSubscribes) {
        expect(frame).toEqual(subscribeMessage('AAPL'))
      }
    })

    // Spec input_parameters aliases
    it.each([
      ['base/quote', { base: 'AAPL', quote: 'USD' }],
      ['coin/market', { coin: 'AAPL', market: 'USD' }],
      ['symbol/market (accepts symbol alias)', { symbol: 'AAPL', market: 'USD' }],
    ])('returns the spec example response for %s', async (_, params) => {
      const response = await testAdapter.request({ endpoint: 'stock_quotes', ...params })
      expect(response.statusCode).toBe(200)
      expectSpecExample(response.json())
    })

    // Spec sample_response: Alpaca symbols are uppercase (S: "AAPL"). A lowercase request for the
    // same ticker must be served by the cached AAPL quote (spec example values)
    it('stock_quotes lowercase from/to returns the cached mid price', async () => {
      pushFrames([AAPL_QUOTE])
      await step()

      const response = await testAdapter.request({ from: 'aapl', to: 'usd' })
      expect(response.statusCode).toBe(200)
      expect(response.json().data.mid_price).toBe(190.0)
      expectSpecExample(response.json())
    })

    // Spec input_parameters: base and quote are required
    it.each([
      ['empty body', {}],
      ['missing base', { endpoint: 'stock_quotes', quote: 'USD' }],
      ['missing quote', { endpoint: 'stock_quotes', base: 'AAPL' }],
    ])('%s returns 400', async (_, params) => {
      const response = await testAdapter.request(params)
      expect(response.statusCode).toBe(400)
    })

    // Spec sample_response: frames are JSON arrays that can mix event types. The SPY array holds a
    // success frame and two quote frames (AAPL, SPY) with the spec wire_input values.
    it('handles multi-event array', async () => {
      const spy = await requestUntilCached({ base: 'SPY', quote: 'USD' })
      expect(spy.statusCode).toBe(200)
      expectSpecExample(spy.json())

      const aapl = await testAdapter.request(exampleRequest)
      expect(aapl.statusCode).toBe(200)
      expectSpecExample(aapl.json())
    })

    // Spec stock_quotes: quotes only (trades are delayed and not used). Success, subscription,
    // error and trade events are ignored, even when a non-q event carries quote-shaped fields for a
    // subscribed symbol with a newer t. The cached AAPL value stays the spec example.
    it('ignores non-q frames', async () => {
      const later = '2026-09-17T00:31:15.000000000Z'
      const quoteShaped = { S: 'AAPL', bp: 1, bs: 9, ap: 3, as: 9, t: later }
      pushFrames([
        { T: 'success', msg: 'authenticated' },
        { T: 'subscription', trades: [], quotes: ['AAPL'] },
        { T: 'error', code: 400, msg: 'invalid syntax' },
        { T: 't', i: 1, x: 'B', p: 2, s: 9, ...quoteShaped },
        { T: 'b', o: 2, h: 2, l: 2, c: 2, v: 9, ...quoteShaped },
      ])
      await step()
      await step()

      const response = await testAdapter.request(exampleRequest)
      expect(response.statusCode).toBe(200)
      expectSpecExample(response.json())
    })

    // Owner decision one_sided_semantics=match_reference: mid is the non-zero side, the zero side
    // is reported as-is (no nulls, no error)
    it.each([
      ['ask is zero: mid = bid', 'BIDONLY', { mid_price: 189.95, bid_price: 189.95, ask_price: 0 }],
      ['bid is zero: mid = ask', 'ASKONLY', { mid_price: 190.05, bid_price: 0, ask_price: 190.05 }],
    ])('one-sided book, %s', async (_, base, expected) => {
      const response = await requestUntilCached({ base, quote: 'USD' })
      expect(response.statusCode).toBe(200)
      expect(response.json().data).toMatchObject(expected)
      expect(response.json().result).toBe(expected.mid_price)
    })
  })

  // Runs last: it drops the shared connection. Spec refresh_policy per_connect (token expires in
  // 900 s): a reconnect exchanges a new token and authenticates with it, never with the token of
  // the earlier connection, before the stream resumes.
  describe('reconnect', () => {
    it('reconnect after server close fetches a new token', async () => {
      const authMessages = () => received.filter((m) => m.action === 'auth')
      const authFrames = () => authMessages().length
      expect(tokenBodies).toHaveLength(1)
      expect(authMessages()).toEqual([
        { action: 'auth', key: 'access_token', secret: ACCESS_TOKEN },
      ])
      const tokensBefore = tokenBodies.length
      const authsBefore = authFrames()
      const receivedAt = (json: { timestamps?: { providerDataReceivedUnixMs?: number } }) =>
        json.timestamps?.providerDataReceivedUnixMs
      const quoteBefore = receivedAt((await testAdapter.request(exampleRequest)).json())

      mockWsServer?.clients().forEach((client) => client.close())
      for (let i = 0; i < 20 && authFrames() === authsBefore; i++) {
        await step()
      }

      expect(tokenBodies.length).toBe(tokensBefore + 1)
      expect(authFrames()).toBe(authsBefore + 1)
      // The second connection authenticates with the second issued token
      expect(authMessages()[1]).toEqual({
        action: 'auth',
        key: 'access_token',
        secret: SECOND_ACCESS_TOKEN,
      })

      // The stream resumes on the new connection. The replayed spec quote has the cached t, so it is
      // dropped (spec data_freshness t); a quote with a newer t is written to the cache.
      const resumedT = '2026-09-17T00:30:16Z'
      pushFrames([{ ...AAPL_QUOTE, t: resumedT }])
      let response = await testAdapter.request(exampleRequest)
      for (
        let i = 0;
        i < 20 && (response.statusCode !== 200 || receivedAt(response.json()) === quoteBefore);
        i++
      ) {
        await step()
        pushFrames([{ ...AAPL_QUOTE, t: resumedT }])
        response = await testAdapter.request(exampleRequest)
      }
      expect(response.statusCode).toBe(200)
      expect(receivedAt(response.json())).toBeGreaterThan(quoteBefore ?? 0)
      expect(response.json()).toMatchObject({
        result: exampleResponse.result,
        data: exampleResponse.data,
        timestamps: { providerIndicatedTimeUnixMs: Date.parse(resumedT) },
      })
    })

    // Runs after the reconnect above: two connects, so two token exchanges, and each connection's
    // auth frame (spec ws_auth_message) carries the token issued for that connect
    it('requests a new token on each connect and sends the auth message with that token', () => {
      const authMessages = received.filter((m) => m.action === 'auth')
      expect(tokenBodies).toHaveLength(ISSUED_TOKENS.length)
      for (const body of tokenBodies) {
        expect(Object.fromEntries(new URLSearchParams(body))).toEqual({
          grant_type: 'client_credentials',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        })
      }
      expect(authMessages).toEqual(
        ISSUED_TOKENS.map((token) => ({ action: 'auth', key: 'access_token', secret: token })),
      )
    })
  })
})
