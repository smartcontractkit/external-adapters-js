import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub, setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import '../../src/endpoint/ssa'
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
  it.each([['0'], ['6'], ['2.5'], ['abc'], [''], [' 2 '], [null], [2]])(
    'rejects an invalid provider score %p',
    (value) => {
      expect(() => parseScore(value)).toThrow('SSA score')
    },
  )

  it.each([
    ['not-a-date'],
    [''],
    [null],
    [123],
    ['2025-02-30T00:00Z'],
    ['2025-01-17T00:00:00'],
    ['01/17/2025'],
    ['0'],
  ])('rejects an unparseable provider timestamp %p', (value) => {
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
    const callsAfterFirst = requester.request.mock.calls.length
    await persistent.backgroundHandler(context, [{ security_id: 'SP-401' }])
    expect(callsAfterFirst).toBe(3)
    expect(requester.request.mock.calls.length).toBe(3)
    expect(responseCache.write).toHaveBeenCalledTimes(2)
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
    const baseWrite = responseCache.write.getMockImplementation()
    if (!baseWrite) {
      throw new Error('missing cache write implementation')
    }
    let releaseWrite: (() => void) | undefined
    const writeGate = new Promise<void>((resolve) => {
      releaseWrite = resolve
    })
    let blocked = false
    responseCache.write.mockImplementation(
      async (name: string, results: { params: { security_id: string }; response: unknown }[]) => {
        if (!blocked) {
          blocked = true
          await writeGate
        }
        await baseWrite(name, results)
      },
    )

    const first = transport.backgroundHandler(context, [{ security_id: 'SP-RACE' }])
    resolveFirstData?.(
      dataResponse([
        record({
          security_id: 'SP-RACE',
          ssa: '1',
          last_modified_date_time: '2024-12-04T00:00Z',
        }),
      ]),
    )
    await new Promise((resolve) => setImmediate(resolve))
    const second = transport.backgroundHandler(context, [{ security_id: 'SP-RACE' }])
    releaseWrite?.()
    await Promise.all([first, second])

    expect(responseCache.write).toHaveBeenCalledTimes(4)
    const final = cacheStore.get('cache-key-SP-RACE') as { result?: number } | undefined
    expect(final?.result).toBe(5)
    responseCache.write.mockImplementation(baseWrite)
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

  it('ships the rate-limit tier and default strategy', async () => {
    const { adapter } = await import('../../src')
    const tier = adapter.rateLimiting?.tiers?.default
    expect(tier?.rateLimit1m).toBe(300)
    expect(tier?.note ?? '').toContain('RATE_LIMIT_CAPACITY_MINUTE')
    expect(adapter.config.settings.RATE_LIMITING_STRATEGY).toBe('fixed-interval')
    expect(adapter.config.settings.API_TIMEOUT).toBe(10_000)
    expect(adapter.config.settings.RETRY).toBe(0)
  })
})
