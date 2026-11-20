import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/reserve'
import { TokenManager } from '../../src/transport/auth'

const USER_ID = '31415926'
const PASSWORD = 'test-password'
const HMAC_SECRET = 'test-hmac-secret'
const AGREEMENT = '654321-7'
const ACCESS_TOKEN = 'test-access-token'
const REFRESH_TOKEN = 'test-refresh-token'
const REFRESHED_ACCESS_TOKEN = 'refreshed-access-token'
const RELOGIN_ACCESS_TOKEN = 'relogin-access-token'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RequestConfig = {
  baseURL?: string
  url?: string
  method?: string
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

const authResult = (accessToken: string, refreshToken: string) => ({
  response: { status: 200, data: { accessToken, refreshToken } },
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

const configOf = (call: unknown[]): RequestConfig => call[1] as unknown as RequestConfig

describe('TokenManager', () => {
  let requestMock: jest.Mock
  let manager: TokenManager

  beforeEach(() => {
    jest.clearAllMocks()
    requestMock = jest.fn()
    const requester = { request: requestMock } as unknown as Requester
    manager = new TokenManager(requester, settings, 'reserve', 'default_single_transport')
  })

  it('logs in on the first getAccessToken and returns the access token', async () => {
    requestMock.mockResolvedValueOnce(authResult(ACCESS_TOKEN, REFRESH_TOKEN))

    await expect(manager.getAccessToken()).resolves.toBe(ACCESS_TOKEN)

    expect(requestMock).toHaveBeenCalledTimes(1)
    const config = configOf(requestMock.mock.calls[0])
    expect(config).toMatchObject({
      baseURL: settings.API_ENDPOINT,
      url: '/api/b2c/v1/auth',
      method: 'POST',
      data: { username: USER_ID, password: PASSWORD },
    })
    expect(config.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(config.headers?.['X-Request-Id']).toMatch(UUID_V4)
    expect(config.headers?.['X-Correlation-Id']).toMatch(UUID_V4)
    expect(config.headers?.Authorization).toBeUndefined()
    expect(
      Object.keys(config.headers ?? {}).filter((key) => key.toLowerCase().startsWith('amina-')),
    ).toEqual([])
  })

  it('reuses the held access token without another login', async () => {
    requestMock.mockResolvedValueOnce(authResult(ACCESS_TOKEN, REFRESH_TOKEN))

    await expect(manager.getAccessToken()).resolves.toBe(ACCESS_TOKEN)
    await expect(manager.getAccessToken()).resolves.toBe(ACCESS_TOKEN)

    expect(requestMock).toHaveBeenCalledTimes(1)
  })

  it('renews with only the refreshToken and holds the new tokens', async () => {
    requestMock
      .mockResolvedValueOnce(authResult(ACCESS_TOKEN, REFRESH_TOKEN))
      .mockResolvedValueOnce(authResult(REFRESHED_ACCESS_TOKEN, 'next-refresh-token'))

    await manager.getAccessToken()
    await expect(manager.renew()).resolves.toBe(REFRESHED_ACCESS_TOKEN)

    expect(requestMock).toHaveBeenCalledTimes(2)
    const refresh = configOf(requestMock.mock.calls[1])
    expect(refresh).toMatchObject({
      baseURL: settings.API_ENDPOINT,
      url: '/api/b2c/v1/auth',
      method: 'POST',
      data: { refreshToken: REFRESH_TOKEN },
    })
    expect(refresh.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(refresh.headers?.['X-Request-Id']).toMatch(UUID_V4)
    expect(refresh.headers?.['X-Correlation-Id']).toMatch(UUID_V4)
    expect(refresh.headers?.Authorization).toBeUndefined()
    expect(
      Object.keys(refresh.headers ?? {}).filter((key) => key.toLowerCase().startsWith('amina-')),
    ).toEqual([])

    await expect(manager.getAccessToken()).resolves.toBe(REFRESHED_ACCESS_TOKEN)
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('logs in again when the refresh reply is a 401', async () => {
    requestMock
      .mockResolvedValueOnce(authResult(ACCESS_TOKEN, REFRESH_TOKEN))
      .mockRejectedValueOnce(providerError(401))
      .mockResolvedValueOnce(authResult(RELOGIN_ACCESS_TOKEN, REFRESH_TOKEN))

    await manager.getAccessToken()
    await expect(manager.renew()).resolves.toBe(RELOGIN_ACCESS_TOKEN)

    expect(requestMock).toHaveBeenCalledTimes(3)
    const refresh = configOf(requestMock.mock.calls[1])
    expect(refresh.data).toEqual({ refreshToken: REFRESH_TOKEN })
    const loginAgain = configOf(requestMock.mock.calls[2])
    expect(loginAgain.data).toEqual({ username: USER_ID, password: PASSWORD })
  })

  it('returns 502 without a second login when the refresh reply is not a 401', async () => {
    requestMock
      .mockResolvedValueOnce(authResult(ACCESS_TOKEN, REFRESH_TOKEN))
      .mockRejectedValueOnce(providerError(500))

    await manager.getAccessToken()
    await expect(manager.renew()).rejects.toMatchObject({
      statusCode: 502,
      providerStatusCode: 500,
    })

    expect(requestMock).toHaveBeenCalledTimes(2)
    expect(configOf(requestMock.mock.calls[0]).data).toEqual({
      username: USER_ID,
      password: PASSWORD,
    })
    expect(configOf(requestMock.mock.calls[1]).data).toEqual({ refreshToken: REFRESH_TOKEN })
  })

  it.each([
    ['an empty reply', {}],
    ['no refresh token', { accessToken: ACCESS_TOKEN }],
    ['no access token', { refreshToken: REFRESH_TOKEN }],
  ])('returns 502 for %s', async (_, body) => {
    requestMock.mockResolvedValueOnce({
      response: { status: 200, data: body },
      timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
    })

    await expect(manager.getAccessToken()).rejects.toMatchObject({ statusCode: 502 })
  })
})
