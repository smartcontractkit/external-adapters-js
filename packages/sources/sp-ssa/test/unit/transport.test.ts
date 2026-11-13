import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub, setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import {
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import '../../src/endpoint/ssa'
import { isCredentialFailure, SsaAuthError } from '../../src/transport/request'
import { SsaTransport, SsaTransportTypes } from '../../src/transport/ssa'
import { parseScore, parseTimestamp } from '../../src/transport/utils'

beforeAll(() => {
  process.env.API_ENDPOINT = 'http://api.com'
  process.env.TOKEN_ENDPOINT = 'http://token.com/token'
  process.env.CLIENT_ID = 'client-id'
  process.env.API_KEY = 'api-key'
  config.initialize()
})

const log = jest.fn()
const mockLogger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}
LoggerFactoryProvider.set({ child: () => mockLogger })

const record = (overrides: Record<string, unknown> = {}) => ({
  last_modified_date_time: '2025-01-17T00:00Z',
  security_id: 'SP-EURC',
  security_name: 'EURC',
  ssa: '2',
  ssa_desc: 'Strong',
  ...overrides,
})

const tokenResponse = {
  response: { data: { access_token: 'test-token', expires_in: 1800 }, status: 200 },
  timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
}

const dataResponse = (records: Record<string, unknown>[]) => ({
  response: { data: records, status: 200 },
  timestamps: { providerDataRequestedUnixMs: 100, providerDataReceivedUnixMs: 200 },
})

describe('provider record parsing', () => {
  it.each([
    { value: '1', expected: 1 },
    { value: '2', expected: 2 },
    { value: '3', expected: 3 },
    { value: '4', expected: 4 },
    { value: '5', expected: 5 },
    { value: '0' },
    { value: '6' },
    { value: '2.5' },
    { value: 'abc' },
    { value: '' },
    { value: ' 2 ' },
    { value: null },
    { value: 2 },
  ])('validates a provider score $value', ({ value, expected }) => {
    if (expected === undefined) {
      expect(() => parseScore(value)).toThrow('SSA score')
    } else {
      expect(parseScore(value)).toBe(expected)
    }
  })

  it.each([
    ['not-a-date'],
    [''],
    [null],
    [123],
    ['2025-02-30T00:00Z'],
    ['2025-01-17T00:00:00'],
    ['2025-1-7T00:00Z'],
    ['2025-01-17T24:00Z'],
    ['2025-01-17T00:00:05.5Z'],
    ['2025-01-17T00:00:05Z '],
    ['1900-01-01T00:00Z'],
    ['9999-12-31T23:59Z'],
    ['01/17/2025'],
    ['0'],
  ])('rejects an invalid provider timestamp %p', (value) => {
    expect(() => parseTimestamp(value)).toThrow('last_modified_date_time')
  })
})

type WrittenResult = {
  params: { security_id: string }
  response: { result?: number; statusCode?: number; errorMessage?: string }
}

describe('SsaTransport', () => {
  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: 'http://api.com',
    TOKEN_ENDPOINT: 'http://token.com/token',
    CLIENT_ID: 'client-id',
    API_KEY: 'api-key',
    ORIGIN: 'test-origin',
    BACKGROUND_EXECUTE_MS_HTTP: 0,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    MAX_COMMON_KEY_SIZE: 300,
    FEED_ID_JSON: false,
    DEFAULT_CACHE_KEY: 'default',
    CACHE_MAX_AGE: 90_000,
  } as unknown as SsaTransportTypes['Settings'])

  const requester = makeStub('requester', { request: jest.fn() })
  const cacheStore = new Map<string, unknown>()
  const responseCache = {
    write: jest.fn(
      async (_name: string, results: { params: { security_id: string }; response: unknown }[]) => {
        for (const result of results) {
          cacheStore.set(`cache-key-${result.params.security_id}`, result.response)
        }
      },
    ),
    get: jest.fn(async (key: string) => cacheStore.get(key)),
    getCacheKey: jest.fn(
      (_: string, params: { security_id: string }) => `cache-key-${params.security_id}`,
    ),
    cache: { delete: jest.fn(async (key: string) => cacheStore.delete(key)) },
  }
  const subscriptionSetFactory = makeStub('subscriptionSetFactory', {
    buildSet: jest.fn(() => ({ getAll: jest.fn() })),
  })
  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<SsaTransportTypes>)
  const context = makeStub('context', {
    adapterSettings,
    endpointName: 'ssa',
  } as unknown as EndpointContext<SsaTransportTypes>)

  let transport: SsaTransport

  beforeEach(async () => {
    cacheStore.clear()
    jest.clearAllMocks()
    requester.request.mockReset()
    requester.request.mockResolvedValue(tokenResponse)
    transport = new SsaTransport()
    await transport.initialize(dependencies, adapterSettings, 'ssa', 'default_single_transport')
    requester.request.mockReset()
  })

  it('batches all subscriptions into one provider request', async () => {
    requester.request.mockResolvedValueOnce(
      dataResponse([record(), record({ security_id: 'SP-GUSD', security_name: 'GUSD' })]),
    )

    const entries = [{ security_id: 'SP-EURC' }, { security_id: 'SP-GUSD' }]
    await transport.backgroundHandler(context, entries)

    expect(requester.request).toHaveBeenCalledTimes(1)
    expect(requester.request).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        baseURL: 'http://api.com',
        url: '/api/v1/ssa/getAllScores',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          apikey: 'api-key',
          Origin: 'test-origin',
        },
      }),
    )
    expect(responseCache.write).toHaveBeenCalledTimes(1)
    const written = responseCache.write.mock.calls[0][1] as WrittenResult[]
    expect(written).toHaveLength(2)
    expect(written[0].response.result).toBe(2)
    expect(written[1].params.security_id).toBe('SP-GUSD')
    expect(responseCache.cache.delete).not.toHaveBeenCalled()
  })

  it('deletes the cached success before writing a provider error', async () => {
    requester.request.mockResolvedValueOnce(dataResponse([record({ ssa: '0' })]))

    await transport.backgroundHandler(context, [{ security_id: 'SP-EURC' }])

    expect(responseCache.cache.delete).toHaveBeenCalledWith('cache-key-SP-EURC')
    expect(responseCache.write).toHaveBeenCalledTimes(1)
    const written = responseCache.write.mock.calls[0][1] as WrittenResult[]
    expect(written[0].response.statusCode).toBe(502)
    expect(written[0].response.errorMessage).toContain('SSA score')
  })

  it('recovers from one 401 and backs off after a persistent one', async () => {
    const authError = new AdapterDataProviderError(
      { statusCode: 502, message: 'unauthorized', providerStatusCode: 401 },
      {
        providerDataRequestedUnixMs: 1,
        providerDataReceivedUnixMs: 2,
        providerIndicatedTimeUnixMs: undefined,
      },
    )
    const freshToken = {
      response: { data: { access_token: 'fresh-token', expires_in: 1800 }, status: 200 },
      timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
    }
    requester.request
      .mockRejectedValueOnce(authError)
      .mockResolvedValueOnce(freshToken)
      .mockResolvedValueOnce(dataResponse([record({ security_id: 'SP-RECOVER' })]))
    await transport.backgroundHandler(context, [{ security_id: 'SP-RECOVER' }])
    expect(requester.request).toHaveBeenCalledTimes(3)
    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      }),
    )
    expect(responseCache.write).toHaveBeenLastCalledWith('default_single_transport', [
      expect.objectContaining({
        response: expect.objectContaining({ result: 2 }),
      }),
    ])

    const persistent = new SsaTransport()
    requester.request.mockReset()
    requester.request.mockResolvedValueOnce(tokenResponse)
    await persistent.initialize(dependencies, adapterSettings, 'ssa', 'default_single_transport')
    requester.request.mockReset()
    requester.request
      .mockRejectedValueOnce(authError)
      .mockResolvedValueOnce(freshToken)
      .mockRejectedValueOnce(authError)
    await persistent.backgroundHandler(context, [{ security_id: 'SP-401' }])
    expect(responseCache.write).toHaveBeenLastCalledWith('default_single_transport', [
      expect.objectContaining({
        response: expect.objectContaining({
          statusCode: 502,
          timestamps: expect.objectContaining({
            providerDataRequestedUnixMs: 1,
            providerDataReceivedUnixMs: 2,
          }),
        }),
      }),
    ])
    const callsAfterFirst = requester.request.mock.calls.length
    await persistent.backgroundHandler(context, [{ security_id: 'SP-401' }])
    expect(callsAfterFirst).toBe(3)
    expect(requester.request.mock.calls.length).toBe(3)

    await persistent.backgroundHandler(context, [{ security_id: 'SP-GUSD' }])
    expect(requester.request.mock.calls.length).toBe(3)
    expect(responseCache.write).toHaveBeenCalledTimes(3)
    expect(responseCache.write).toHaveBeenLastCalledWith('default_single_transport', [
      expect.objectContaining({
        params: { security_id: 'SP-GUSD' },
        response: expect.objectContaining({
          statusCode: 502,
          errorMessage: expect.stringContaining('cooldown'),
        }),
      }),
    ])

    const forbidden = new AdapterDataProviderError(
      { statusCode: 502, message: 'forbidden', providerStatusCode: 403 },
      {
        providerDataRequestedUnixMs: 1,
        providerDataReceivedUnixMs: 2,
        providerIndicatedTimeUnixMs: undefined,
      },
    )
    const forbiddenTransport = new SsaTransport()
    requester.request.mockReset()
    requester.request.mockResolvedValueOnce(tokenResponse)
    await forbiddenTransport.initialize(
      dependencies,
      adapterSettings,
      'ssa',
      'default_single_transport',
    )
    requester.request.mockReset()
    requester.request
      .mockRejectedValueOnce(forbidden)
      .mockResolvedValueOnce(freshToken)
      .mockResolvedValueOnce(dataResponse([record({ security_id: 'SP-403' })]))
    await forbiddenTransport.backgroundHandler(context, [{ security_id: 'SP-403' }])
    expect(requester.request).toHaveBeenCalledTimes(3)
    expect(responseCache.write).toHaveBeenLastCalledWith('default_single_transport', [
      expect.objectContaining({
        response: expect.objectContaining({ result: 2 }),
      }),
    ])

    expect(
      isCredentialFailure(
        new SsaAuthError(new AdapterError({ statusCode: 502, providerStatusCode: 201 })),
      ),
    ).toBe(false)
    expect(
      isCredentialFailure(
        new SsaAuthError(new AdapterError({ statusCode: 502, providerStatusCode: 401 })),
      ),
    ).toBe(true)

    const rateLimitedTransport = new SsaTransport()
    requester.request.mockReset()
    requester.request.mockResolvedValueOnce(tokenResponse)
    await rateLimitedTransport.initialize(
      dependencies,
      adapterSettings,
      'ssa',
      'default_single_transport',
    )
    requester.request.mockReset()
    requester.request.mockRejectedValueOnce(
      new AdapterRateLimitError({ statusCode: 429, message: 'rate limited' }),
    )
    await rateLimitedTransport.backgroundHandler(context, [{ security_id: 'SP-429' }])
    expect(responseCache.write).toHaveBeenLastCalledWith('default_single_transport', [
      expect.objectContaining({
        response: expect.objectContaining({
          statusCode: 429,
          errorMessage: 'rate limited',
        }),
      }),
    ])
  })

  it('publishes a backdated provider response and drops an overlapping older handler', async () => {
    requester.request.mockResolvedValueOnce(
      dataResponse([
        record({ security_id: 'SP-STALE', last_modified_date_time: '2025-01-17T00:00Z' }),
      ]),
    )
    await transport.backgroundHandler(context, [{ security_id: 'SP-STALE' }])
    requester.request.mockResolvedValueOnce(
      dataResponse([
        record({ security_id: 'SP-STALE', last_modified_date_time: '2024-12-04T00:00Z' }),
      ]),
    )
    await transport.backgroundHandler(context, [{ security_id: 'SP-STALE' }])
    expect(responseCache.write).toHaveBeenCalledTimes(2)

    responseCache.write.mockClear()
    let resolveFirstData: ((value: ReturnType<typeof dataResponse>) => void) | undefined
    const firstData = new Promise<ReturnType<typeof dataResponse>>((resolve) => {
      resolveFirstData = resolve
    })
    let dataCalls = 0
    requester.request.mockImplementation((key: string) => {
      if (key === 'sp-ssa-token') {
        return Promise.resolve(tokenResponse)
      }
      dataCalls++
      if (dataCalls === 1) {
        return firstData
      }
      return Promise.resolve(
        dataResponse([
          record({
            security_id: 'SP-RACE',
            ssa: '5',
            last_modified_date_time: '2025-01-17T00:00Z',
          }),
        ]),
      )
    })

    const first = transport.backgroundHandler(context, [{ security_id: 'SP-RACE' }])
    await new Promise((resolve) => setImmediate(resolve))
    const second = transport.backgroundHandler(context, [{ security_id: 'SP-RACE' }])
    await second

    // The older fetch resolves after the newer handler has advanced the
    // generation, so its queued write must be dropped.
    resolveFirstData?.(
      dataResponse([
        record({
          security_id: 'SP-RACE',
          ssa: '1',
          last_modified_date_time: '2024-12-04T00:00Z',
        }),
      ]),
    )
    await first

    expect(responseCache.write).toHaveBeenCalledTimes(1)
    const final = cacheStore.get('cache-key-SP-RACE') as { result?: number } | undefined
    expect(final?.result).toBe(5)
  })
})

describe('adapter configuration', () => {
  const oldEnv = { ...process.env }

  beforeAll(() => {
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.TOKEN_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
  })

  afterAll(() => {
    setEnvVariables(oldEnv)
  })

  it('ships the rate-limit tier and request overrides', async () => {
    const { adapter } = await import('../../src')
    const tier = adapter.rateLimiting?.tiers?.default
    expect(tier?.rateLimit1m).toBe(300)
    expect(tier?.note ?? '').toContain('RATE_LIMIT_CAPACITY_MINUTE')
    expect(adapter.config.settings.API_TIMEOUT).toBe(10_000)
    expect(adapter.config.settings.RETRY).toBe(0)
  })
})
