import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub, setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import '../../src/endpoint/ssa'
import { SsaTransport, SsaTransportTypes } from '../../src/transport/ssa'
import { parseProviderRecords, parseScore, parseTimestamp } from '../../src/transport/utils'

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
  response: { data: { access_token: 'test-token', expires_in: 1800 } },
  timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
}

const dataResponse = (records: Record<string, unknown>[]) => ({
  response: { data: records, status: 200 },
  timestamps: { providerDataRequestedUnixMs: 100, providerDataReceivedUnixMs: 200 },
})

describe('provider record parsing', () => {
  it('parses the documented provider score and timestamp', () => {
    const records = parseProviderRecords([record()])
    expect(records).toHaveLength(1)
    expect(parseScore(records[0]?.ssa)).toBe(2)
    expect(parseTimestamp(records[0]?.last_modified_date_time)).toBe(1737072000000)
    expect(() => parseProviderRecords({})).toThrow('malformed payload')
    expect(() => parseProviderRecords([record(), record()])).toThrow('malformed payload')
  })

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
  const responseCache = {
    write: jest.fn(),
    getCacheKey: jest.fn(() => 'cache-key'),
    cache: { delete: jest.fn() },
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
    jest.clearAllMocks()
    transport = new SsaTransport()
    await transport.initialize(dependencies, adapterSettings, 'ssa', 'default_single_transport')
  })

  it('batches all subscriptions into one provider request', async () => {
    requester.request
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(
        dataResponse([record(), record({ security_id: 'SP-GUSD', security_name: 'GUSD' })]),
      )

    const entries = [{ security_id: 'SP-EURC' }, { security_id: 'SP-GUSD' }]
    await transport.backgroundHandler(context, entries)

    expect(requester.request).toHaveBeenCalledTimes(2)
    expect(requester.request).toHaveBeenNthCalledWith(
      2,
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
    const written = responseCache.write.mock.calls[0][1]
    expect(written).toHaveLength(2)
    expect(written[0].response.result).toBe(2)
    expect(written[1].params.security_id).toBe('SP-GUSD')
    expect(responseCache.cache.delete).not.toHaveBeenCalled()
  })

  it('deletes the cached success before writing a provider error', async () => {
    requester.request
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(dataResponse([record({ ssa: '0' })]))

    await transport.backgroundHandler(context, [{ security_id: 'SP-EURC' }])

    expect(responseCache.cache.delete).toHaveBeenCalledWith('cache-key')
    expect(responseCache.write).toHaveBeenCalledTimes(1)
    const written = responseCache.write.mock.calls[0][1]
    expect(written[0].response.statusCode).toBe(502)
    expect(written[0].response.errorMessage).toContain('SSA score')
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

  it('ships a bounded default rate limit', async () => {
    const { adapter } = await import('../../src')
    const tier = adapter.rateLimiting?.tiers?.default
    expect(tier?.rateLimit1m).toBe(10)
    expect(tier?.note ?? '').toContain('RATE_LIMIT_CAPACITY_MINUTE')
    expect(adapter.config.settings.RATE_LIMITING_STRATEGY).toBe('burst')
  })
})
