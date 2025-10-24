import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  endSSEStream,
  mockStreamPost,
  mockStreamPostAnyBody,
  mockStreamPostRawAnyBody,
  mockStreamPostRawMatchingBody,
  sseEventChunk,
  waitFor,
} from './fixtures'

jest.setTimeout(10000)

describe('coinpaprika-state adapter', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let outSpy: jest.SpyInstance, errSpy: jest.SpyInstance

  beforeAll(async () => {
    outSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    errSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)

    process.env.LOG_LEVEL = 'silent'
    process.env.EA_LOG_LEVEL = 'silent'
    process.env.PINO_LOG_LEVEL = 'silent'
    process.env.METRICS_ENABLED = 'false'
    process.env.RETRY = '0'

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'TEST-KEY'
    process.env.API_ENDPOINT = 'http://localhost:1234'
    process.env.BACKGROUND_EXECUTE_MS = '100'

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    await testAdapter.api.close()
    setEnvVariables(oldEnv)
    outSpy.mockRestore()
    errSpy.mockRestore()
  })

  afterEach(() => {
    // Clean up nock after each test to prevent interference
    nock.cleanAll()
  })

  it('happy path: streams ticks and serves latest state_price for LUSD/USD', async () => {
    const { scope, stream } = mockStreamPost({
      apiBase: 'http://localhost:1234',
      pairs: [{ base: 'LUSD', quote: 'USD' }],
      events: [
        {
          block_time: 1756224311,
          base_token_symbol: 'LUSD',
          quote_symbol: 'USD',
          state_price: 1.0005,
          volume_7d_usd: 1234.56,
          market_depth_plus_1_usd: 0,
          market_depth_minus_1_usd: 0,
        },
        {
          block_time: 1756224313,
          base_token_symbol: 'LUSD',
          quote_symbol: 'USD',
          state_price: 1.0007,
          volume_7d_usd: 2222,
          market_depth_plus_1_usd: 0,
          market_depth_minus_1_usd: 0,
        },
      ],
    })

    await waitFor(async () => {
      const r = await testAdapter.request({ base: 'LUSD', quote: 'USD' })
      expect(r.statusCode).toBe(200)
      expect(r.json().result).toBeCloseTo(1.0007, 3)
      expect(r.json().timestamps.providerIndicatedTimeUnixMs).toBe(1756224313000)
    })

    endSSEStream(stream)
    scope.done()
  })

  it('returns 504 when no data available', async () => {
    const scope = nock('http://localhost:1234')
      .post('/stream')
      .matchHeader('authorization', 'TEST-KEY')
      .reply(200, () => ':heartbeat\n\n', { 'Content-Type': 'text/event-stream' })
      .persist()

    await new Promise((resolve) => setTimeout(resolve, 300))

    const response = await testAdapter.request({
      base: 'UNKNOWN_X',
      quote: 'USD',
    })

    expect(response.statusCode).toBe(504)
    scope.persist(false)
    nock.cleanAll()
  })

  it('401 conection error response causes 504 return', async () => {
    const scope = nock('http://localhost:1234')
      .post('/stream')
      .matchHeader('authorization', 'INVALID-KEY')
      .reply(401, { error: 'api key verification has failed' })
      .persist()

    await new Promise((resolve) => setTimeout(resolve, 300))

    const response = await testAdapter.request({
      base: 'ETH401',
      quote: 'USD',
    })

    expect(response.statusCode).toBe(504)
    scope.persist(false)
    nock.cleanAll()
  })

  it('400 connection error response causes 504 return', async () => {
    const scope = nock('http://localhost:1234')
      .post('/stream')
      .reply(400, { error: 'bad' })
      .persist()
    await new Promise((r) => setTimeout(r, 200))
    const res = await testAdapter.request({ base: 'ERR400', quote: 'USD' })
    expect(res.statusCode).toBe(504)
    scope.persist(false)
    nock.cleanAll()
  })

  it('multi-pair batching: caches all pairs independently', async () => {
    const { scope, stream } = mockStreamPostAnyBody({
      apiBase: 'http://localhost:1234',
      events: [
        { block_time: 10, base_token_symbol: 'LUSD', quote_symbol: 'USD', state_price: '1.01' },
        { block_time: 12, base_token_symbol: 'EURA', quote_symbol: 'USD', state_price: '1.02' },
        { block_time: 14, base_token_symbol: 'LUSD', quote_symbol: 'USD', state_price: '1.03' },
      ],
    })

    void testAdapter.request({ base: 'LUSD', quote: 'USD' })
    void testAdapter.request({ base: 'EURA', quote: 'USD' })

    await waitFor(async () => {
      const r1 = await testAdapter.request({ base: 'LUSD', quote: 'USD' })
      const r2 = await testAdapter.request({ base: 'EURA', quote: 'USD' })
      expect(r1.statusCode).toBe(200)
      expect(r2.statusCode).toBe(200)
      expect(r1.json().result).toBeCloseTo(1.03)
      expect(r2.json().result).toBeCloseTo(1.02)
    })

    endSSEStream(stream)
    scope.done()
  })

  it('pair-set change triggers reconnect immediately (closes existing stream)', async () => {
    const BASE1 = 'LUSD_A'
    const BASE2 = 'EURA_A'

    const { scope: s1, stream: st1 } = mockStreamPostRawAnyBody({
      apiBase: 'http://localhost:1234',
      chunks: [
        sseEventChunk({
          block_time: 20,
          base_token_symbol: BASE1,
          quote_symbol: 'USD',
          state_price: 1.0,
        }),
      ],
    })

    void testAdapter.request({ base: BASE1, quote: 'USD' })
    await waitFor(async () => {
      const r = await testAdapter.request({ base: BASE1, quote: 'USD' })
      expect(r.statusCode).toBe(200)
      expect(r.json().result).toBeCloseTo(1.0, 3)
    })

    const { scope: s2, stream: st2 } = mockStreamPostAnyBody({
      apiBase: 'http://localhost:1234',
      events: [
        {
          block_time: 22,
          base_token_symbol: BASE2,
          quote_symbol: 'USD',
          state_price: 1.11,
        },
      ],
    })

    void testAdapter.request({ base: BASE2, quote: 'USD' })
    await waitFor(async () => {
      const r = await testAdapter.request({ base: BASE2, quote: 'USD' })
      expect(r.statusCode).toBe(200)
      expect(r.json().result).toBeCloseTo(1.11, 3)
    })

    endSSEStream(st2)
    endSSEStream(st1)
    s1.done()
    s2.done()
  })

  it('ignores events for unknown pairs and non-t_s event types', async () => {
    const { scope, stream } = mockStreamPostRawAnyBody({
      apiBase: 'http://localhost:1234',
      chunks: [
        sseEventChunk({
          block_time: 30,
          base_token_symbol: 'BTC',
          quote_symbol: 'JPY',
          state_price: 9000000,
        }),
        sseEventChunk({ ping: true }, 'heartbeat'),
      ],
    })

    const r = await testAdapter.request({ base: 'XYZ', quote: 'USD' })
    expect(r.statusCode).toBe(504)

    endSSEStream(stream)
    scope.done()
  })

  it('malformed JSON is skipped, keeping last good value only', async () => {
    const BASE = 'LUSD2'
    const QUOTE = 'USD'

    const { scope, stream } = mockStreamPostRawMatchingBody({
      apiBase: 'http://localhost:1234',
      chunks: [
        sseEventChunk('{not-json}'),
        sseEventChunk({
          block_time: 40,
          base_token_symbol: BASE,
          quote_symbol: QUOTE,
          state_price: '1.2',
        }),
      ],
      matchBody: (body) =>
        Array.isArray(body) &&
        body.some((p: { base?: string; quote?: string }) => p?.base === BASE && p?.quote === QUOTE),
    })

    void testAdapter.request({ base: BASE, quote: QUOTE })

    await waitFor(async () => {
      expect(scope.isDone()).toBe(true)
    })

    await waitFor(async () => {
      const r = await testAdapter.request({ base: BASE, quote: QUOTE })
      expect(r.statusCode).toBe(200)
      expect(r.json().result).toBeCloseTo(1.2)
    })

    endSSEStream(stream)
  })

  it('string to number coercion works for state_price and block_time', async () => {
    const BASE = 'COERCE_B'
    const { scope, stream } = mockStreamPostAnyBody({
      apiBase: 'http://localhost:1234',
      events: [
        {
          block_time: '12345',
          base_token_symbol: BASE,
          quote_symbol: 'USD',
          state_price: '1.2345',
        },
      ],
    })
    scope.persist()

    void testAdapter.request({ base: BASE, quote: 'USD' })
    await new Promise((r) => setTimeout(r, 200))

    await waitFor(async () => {
      const r = await testAdapter.request({ base: BASE, quote: 'USD' })
      expect(r.statusCode).toBe(200)
      expect(r.json().result).toBeCloseTo(1.2345, 4)
      expect(r.json().timestamps.providerIndicatedTimeUnixMs).toBe(12345000)
    }, 10_000)

    await waitFor(async () => {
      expect(scope.isDone()).toBe(true)
    })

    endSSEStream(stream)
    scope.persist(false)
  })

  it('error stream message causes request to return 400 for unsupported asset', async () => {
    const { scope, stream } = mockStreamPostRawAnyBody({
      apiBase: 'http://localhost:1234',
      chunks: ['data: {"message":"unsupported CBBTC-USD asset"}\nevent: error\n\n'],
    })
    scope.persist()

    void testAdapter.request({ base: 'CBBTC', quote: 'USD' })
    await new Promise((r) => setTimeout(r, 300))

    const response = await testAdapter.request({ base: 'CBBTC', quote: 'USD' })
    expect(response.statusCode).toBe(400)

    endSSEStream(stream)
    scope.persist(false)
  })
})
