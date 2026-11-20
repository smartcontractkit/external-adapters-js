import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import { inputParameters } from '../../src/endpoint/ssa'
import { SsaHttpTransport } from '../../src/transport/ssa'
import { LOGIN_RESPONSE, SSA_SCORES_RESPONSE } from '../fixtures/provider'

const log = jest.fn()
const debugLog = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: debugLog,
  trace: debugLog,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)
metrics.initialize()

const NOW = 978347471111
const AUTH_URL = 'http://auth.test/gettoken/token'
const API_URL = 'http://api.test'
const SCORES_URL = `${API_URL}/api/v1/ssa/getAllScores`
const INDICATED_TIME_MS = 1766102400000
const TIMESTAMP_SECONDS = 1766102400

const REQUESTER_TIMESTAMPS = {
  providerDataRequestedUnixMs: NOW,
  providerDataReceivedUnixMs: NOW,
}

const adapterSettings = {
  API_ENDPOINT: API_URL,
  AUTH_API_ENDPOINT: AUTH_URL,
  SPGI_CLIENT_ID: 'test-client-id',
  SPGI_APIKEY: 'test-apikey',
  BACKGROUND_EXECUTE_MS_HTTP: 1000,
  WARMUP_SUBSCRIPTION_TTL: 300_000,
  CACHE_MAX_AGE: 90_000,
  MAX_COMMON_KEY_SIZE: 300,
  DEFAULT_CACHE_KEY: 'DEFAULT_CACHE_KEY',
  FEED_ID_JSON: false,
} as unknown as typeof config.settings

const requesterRequest = jest.fn()
const requester = { request: requesterRequest } as unknown as Requester

const responseCache = { write: jest.fn() }
const subscriptionSet = { getAll: jest.fn() }

const dependencies = makeStub('dependencies', {
  requester,
  responseCache,
  subscriptionSetFactory: { buildSet: () => subscriptionSet },
} as any)

const providerUrl = (request: { baseURL?: string; url?: string }): string =>
  new URL(request.url ?? '', request.baseURL ?? 'http://invalid.test').toString()

const headerValue = (headers: unknown, name: string): string | undefined => {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }
  const found = Object.entries(headers as Record<string, unknown>).find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  )
  return found ? String(found[1]) : undefined
}

const record = (
  ssa: string,
  securityId = 'SP-BOUNDARY',
  lastModifiedDateTime: unknown = '2025-12-19T00:00:00Z',
): Record<string, unknown>[] => [
  {
    last_modified_date_time: lastModifiedDateTime,
    security_id: securityId,
    security_name: 'Boundary',
    ssa,
    ssa_desc: 'Strong',
  },
]

const setProvider = (reply: unknown, rejectScores = false): void => {
  requesterRequest.mockImplementation(
    async (_key: string, request: { baseURL?: string; url?: string }) => {
      const url = providerUrl(request)
      if (url === AUTH_URL) {
        return { response: { status: 200, data: LOGIN_RESPONSE }, timestamps: REQUESTER_TIMESTAMPS }
      }
      if (url === SCORES_URL) {
        if (rejectScores) {
          throw new AdapterDataProviderError(
            {
              statusCode: 502,
              name: 'Data Provider error',
              providerStatusCode: 401,
              message: 'Request failed with status code 401',
            },
            {
              providerDataRequestedUnixMs: NOW,
              providerDataReceivedUnixMs: NOW,
              providerIndicatedTimeUnixMs: undefined,
            },
          )
        }
        return { response: { status: 200, data: reply }, timestamps: REQUESTER_TIMESTAMPS }
      }
      throw new Error(`Unexpected provider URL: ${url}`)
    },
  )
}

const expectProviderError = (response: any): void => {
  expect(response.statusCode).toBe(502)
  expect(typeof response.errorMessage).toBe('string')
  expect(response.errorMessage.length).toBeGreaterThan(0)
  expect(response).not.toHaveProperty('result')
}

let transport: SsaHttpTransport

const run = async (securityId: string, reply: unknown, rejectScores = false): Promise<any> => {
  const params = { security_id: securityId }
  subscriptionSet.getAll.mockResolvedValue([params])
  setProvider(reply, rejectScores)

  await transport.backgroundExecute({
    endpointName: 'ssa',
    adapterSettings,
    inputParameters,
  } as any)

  expect(responseCache.write).toHaveBeenCalledTimes(1)
  const [name, entries] = responseCache.write.mock.calls[0]
  expect(name).toBe('default_single_transport')
  expect(entries).toHaveLength(1)
  expect(entries[0].params).toEqual(params)
  return entries[0].response
}

describe('SsaHttpTransport', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
    transport = new SsaHttpTransport()
    await transport.initialize(dependencies, adapterSettings, 'ssa', 'default_single_transport')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('selects the exact security_id record and maps the score and timestamps', async () => {
    const response = await run('SP-EURC', SSA_SCORES_RESPONSE)

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(2)
    expect(response.data).toEqual({
      result: 2,
      exchangeRate: 2,
      validFromTimestamp: TIMESTAMP_SECONDS,
      observationsTimestamp: TIMESTAMP_SECONDS,
    })
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(INDICATED_TIME_MS)
  })

  it('calls the scores endpoint with bearer token, apikey and accept json', async () => {
    await run('SP-EURC', SSA_SCORES_RESPONSE)

    const scoresCall = requesterRequest.mock.calls.find(
      ([, request]) => providerUrl(request) === SCORES_URL,
    )
    expect(scoresCall).toBeDefined()

    const request = scoresCall![1]
    expect(request.method?.toUpperCase()).toBe('GET')
    expect(headerValue(request.headers, 'authorization')).toBe(
      `Bearer ${LOGIN_RESPONSE.access_token}`,
    )
    expect(headerValue(request.headers, 'apikey')).toBe('test-apikey')
    expect(headerValue(request.headers, 'accept')).toBe('application/json')
  })

  it('publishes only the v7 number fields and no provider string', async () => {
    const response = await run('SP-EURC', SSA_SCORES_RESPONSE)

    expect(Object.keys(response.data).sort()).toEqual([
      'exchangeRate',
      'observationsTimestamp',
      'result',
      'validFromTimestamp',
    ])
    Object.values(response.data).forEach((value) => expect(typeof value).toBe('number'))
    const serialized = JSON.stringify(response)
    expect(serialized).not.toContain('ssa_desc')
    expect(serialized).not.toContain('security_name')
  })

  it.each([
    ['lower bound', '1'],
    ['upper bound', '5'],
  ])('accepts the score at the %s', async (_label, score) => {
    const response = await run('SP-BOUNDARY', record(score))

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(Number(score))
    expect(response.data.result).toBe(Number(score))
    expect(response.data.exchangeRate).toBe(Number(score))
  })

  it.each([
    ['0', '0'],
    ['6', '6'],
    ['2.5', '2.5'],
    ['a non-numeric value', 'Strong'],
  ])('rejects the score %s', async (_label, score) => {
    const response = await run('SP-BOUNDARY', record(score))

    expectProviderError(response)
  })

  it.each([
    ['a prefix of a recorded id', 'SP-EUR', SSA_SCORES_RESPONSE],
    ['an absent id', 'SP-NOPE', SSA_SCORES_RESPONSE],
    ['an empty list', 'SP-EMPTY', []],
  ])('returns a provider error for %s', async (_label, securityId, reply) => {
    const response = await run(securityId as string, reply)

    expectProviderError(response)
  })

  it.each([[{}], [null]])(
    'returns a provider error for a reply that is not an array',
    async (reply) => {
      const response = await run('SP-MALFORMED', reply)

      expectProviderError(response)
    },
  )

  it.each([['not-a-date'], [1766102400]])(
    'returns a provider error for an unparseable last_modified_date_time',
    async (lastModified) => {
      const response = await run('SP-BADDATE', record('2', 'SP-BADDATE', lastModified))

      expectProviderError(response)
    },
  )

  it('returns a provider error when the scores request fails', async () => {
    const response = await run('SP-EURC', SSA_SCORES_RESPONSE, true)

    expectProviderError(response)
  })
})
