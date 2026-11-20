import '@chainlink/external-adapter-framework'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/reserve'
import { TokenManager } from '../../src/transport/auth'
import {
  PAGE_SIZE,
  fetchAllPositions,
  fetchPositionsPage,
  positionsPath,
} from '../../src/transport/request'

const PORTFOLIO = '900000001'
const ISIN = 'DE0000000001'
const OTHER_ISIN = 'FR0000000002'
const USER_ID = '31415926'
const PASSWORD = 'test-password'
const HMAC_SECRET = 'test-hmac-secret'
const AGREEMENT = '654321-7'
const ACCESS_TOKEN = 'test-access-token'
const REFRESHED_ACCESS_TOKEN = 'refreshed-access-token'
const TRANSPORT = 'default_single_transport'

// The framework request-key helper logs through the logger factory. A direct
// unit test does not start the adapter, so it sets the factory itself, as the
// framework's custom-background unit-test template does.
const log = jest.fn()
LoggerFactoryProvider.set({
  child: () => ({
    fatal: log,
    error: log,
    warn: log,
    info: log,
    debug: log,
    trace: log,
    msgPrefix: 'mock-logger',
  }),
})

type RequestConfig = {
  baseURL?: string
  url?: string
  method?: string
  params?: Record<string, unknown>
  data?: Record<string, unknown>
  headers?: Record<string, string>
}

const settings = {
  API_ENDPOINT: 'https://sandbox.amina.example',
  AMINA_USER_ID: USER_ID,
  AMINA_PASSWORD: PASSWORD,
  AMINA_HMAC_SECRET: HMAC_SECRET,
  AMINA_AGREEMENT_NUMBER: AGREEMENT,
  RETRY: 0,
  API_TIMEOUT: 60000,
  BACKGROUND_EXECUTE_MS_HTTP: 1000,
  CACHE_MAX_AGE: 360000,
  WARMUP_SUBSCRIPTION_TTL: 300000,
  MAX_COMMON_KEY_SIZE: 300,
} as unknown as BaseEndpointTypes['Settings']

const context = {
  endpointName: 'reserve',
  inputParameters,
  adapterSettings: settings,
} as unknown as EndpointContext<BaseEndpointTypes>

const configOf = (call: unknown[]): RequestConfig => call[1] as unknown as RequestConfig

const pageBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  positions: [],
  totalPages: 1,
  last: true,
  ...overrides,
})

const pageResult = (body: Record<string, unknown>) => ({
  response: { status: 200, data: body },
  timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
})

const providerError = (status: number): AdapterDataProviderError =>
  new AdapterDataProviderError(
    {
      statusCode: 502,
      providerStatusCode: status,
      message: `Request failed with status code ${status}`,
      cause: { response: { status } },
    },
    {
      providerDataRequestedUnixMs: 1,
      providerDataReceivedUnixMs: 2,
      providerIndicatedTimeUnixMs: undefined,
    },
  )

const position = (isin = ISIN): Record<string, unknown> => ({
  isin,
  quantity: 7654.3219,
})

describe('fetchPositionsPage', () => {
  let requestMock: jest.Mock
  let requester: Requester
  let getAccessToken: jest.Mock
  let renew: jest.Mock
  let tokens: TokenManager

  beforeEach(() => {
    requestMock = jest.fn()
    requester = { request: requestMock } as unknown as Requester
    let current = ACCESS_TOKEN
    getAccessToken = jest.fn(async () => current)
    renew = jest.fn(async () => {
      current = REFRESHED_ACCESS_TOKEN
      return current
    })
    tokens = { getAccessToken, renew } as unknown as TokenManager
  })

  it('builds the positions path and requests page 0 with size 20', async () => {
    requestMock.mockResolvedValueOnce(pageResult(pageBody({ positions: [position()] })))

    await fetchPositionsPage(requester, context, TRANSPORT, tokens, PORTFOLIO, 0)

    expect(positionsPath(PORTFOLIO)).toBe('/api/b2c/v1/securities/portfolios/900000001/positions')
    expect(PAGE_SIZE).toBe(20)
    const config = configOf(requestMock.mock.calls[0])
    expect(config).toMatchObject({
      baseURL: settings.API_ENDPOINT,
      url: positionsPath(PORTFOLIO),
      method: 'GET',
      params: { page: 0, size: 20 },
    })
  })

  it('renews once and replays the page with the new token and a new nonce after a 401', async () => {
    requestMock
      .mockRejectedValueOnce(providerError(401))
      .mockResolvedValueOnce(pageResult(pageBody({ positions: [position()] })))

    const result = await fetchPositionsPage(requester, context, TRANSPORT, tokens, PORTFOLIO, 0)

    expect(result).toMatchObject({ positions: [position()], totalPages: 1, last: true })
    expect(renew).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledTimes(2)
    const first = configOf(requestMock.mock.calls[0])
    const replay = configOf(requestMock.mock.calls[1])
    expect(first.headers?.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`)
    expect(replay.headers?.Authorization).toBe(`Bearer ${REFRESHED_ACCESS_TOKEN}`)
    expect(replay.headers?.['Amina-Nonce']).not.toBe(first.headers?.['Amina-Nonce'])
  })

  it('returns 502 without renewing again when the replayed page is a 401', async () => {
    requestMock.mockRejectedValueOnce(providerError(401)).mockRejectedValueOnce(providerError(401))

    await expect(
      fetchPositionsPage(requester, context, TRANSPORT, tokens, PORTFOLIO, 0),
    ).rejects.toMatchObject({ statusCode: 502 })

    expect(renew).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('does not renew the token on a 403', async () => {
    requestMock.mockRejectedValueOnce(providerError(403))

    await expect(
      fetchPositionsPage(requester, context, TRANSPORT, tokens, PORTFOLIO, 0),
    ).rejects.toMatchObject({ statusCode: 502 })

    expect(renew).not.toHaveBeenCalled()
    expect(requestMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['positions is not an array', { positions: 'none', totalPages: 1, last: true }],
    ['totalPages is not a number', { positions: [], totalPages: '1', last: true }],
    ['last is not a boolean', { positions: [], totalPages: 1, last: 'true' }],
  ])('returns 502 when %s', async (_, body) => {
    requestMock.mockResolvedValueOnce(pageResult(body))

    await expect(
      fetchPositionsPage(requester, context, TRANSPORT, tokens, PORTFOLIO, 0),
    ).rejects.toMatchObject({ statusCode: 502 })
  })
})

describe('fetchAllPositions', () => {
  let requestMock: jest.Mock
  let requester: Requester
  let getAccessToken: jest.Mock
  let renew: jest.Mock
  let tokens: TokenManager

  const respondWith = (pages: Record<number, Record<string, unknown>>): void => {
    requestMock.mockImplementation((_key: string, config: RequestConfig) => {
      const pageNo = Number(config.params?.page)
      return Promise.resolve(pageResult(pages[pageNo]))
    })
  }

  beforeEach(() => {
    requestMock = jest.fn()
    requester = { request: requestMock } as unknown as Requester
    getAccessToken = jest.fn(async () => ACCESS_TOKEN)
    renew = jest.fn(async () => REFRESHED_ACCESS_TOKEN)
    tokens = { getAccessToken, renew } as unknown as TokenManager
  })

  it('stops after a page whose last is true even when totalPages is greater', async () => {
    respondWith({
      0: pageBody({ positions: [position()], totalPages: 3, last: true }),
    })

    const result = await fetchAllPositions(requester, context, TRANSPORT, tokens, PORTFOLIO)

    expect(result).toMatchObject([position()])
    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(configOf(requestMock.mock.calls[0]).params).toMatchObject({ page: 0, size: 20 })
  })

  it('requests the next page while last is false and page+1 is less than totalPages', async () => {
    respondWith({
      0: pageBody({ positions: [position(OTHER_ISIN)], totalPages: 2, last: false }),
      1: pageBody({ positions: [position()], totalPages: 2, last: true }),
    })

    const result = await fetchAllPositions(requester, context, TRANSPORT, tokens, PORTFOLIO)

    expect(result).toMatchObject([position(OTHER_ISIN), position()])
    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(configOf(requestMock.mock.calls[0]).params).toMatchObject({ page: 0, size: 20 })
    expect(configOf(requestMock.mock.calls[1]).params).toMatchObject({ page: 1, size: 20 })
    expect(configOf(requestMock.mock.calls[0]).headers?.Authorization).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    )
    expect(configOf(requestMock.mock.calls[1]).headers?.Authorization).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    )
    expect(renew).not.toHaveBeenCalled()
  })

  it('stops when page+1 reaches totalPages even when last is false', async () => {
    respondWith({
      0: pageBody({ positions: [position()], totalPages: 1, last: false }),
    })

    const result = await fetchAllPositions(requester, context, TRANSPORT, tokens, PORTFOLIO)

    expect(result).toMatchObject([position()])
    expect(requestMock).toHaveBeenCalledTimes(1)
  })
})
