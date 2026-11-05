import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager } from '../../src/transport/auth'

const NOW = new Date('2026-11-05T00:00:00Z').getTime()
const NOW_S = Math.floor(NOW / 1000)

const timestamps = {
  providerDataRequestedUnixMs: 1,
  providerDataReceivedUnixMs: 2,
  providerIndicatedTimeUnixMs: undefined,
}

function jwt(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`
}

function authResponse(accessToken: string, refreshToken: string) {
  return {
    response: { status: 200, data: { accessToken, refreshToken } },
    timestamps,
  }
}

function authError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    {
      statusCode: 502,
      providerStatusCode: status,
      message: 'auth failed',
    },
    timestamps,
  )
}

function connectionError(): AdapterConnectionError {
  return new AdapterConnectionError({ statusCode: 502, message: 'connection failed' }, timestamps)
}

describe('AuthManager', () => {
  let requester: { request: jest.Mock }
  let manager: AuthManager

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(NOW))
    requester = { request: jest.fn() }
    manager = new AuthManager(requester as unknown as Requester, {
      apiEndpoint: 'https://amina.test',
      userId: '25742014',
      password: 'password',
      retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('logs in, caches the access token, and reuses it', async () => {
    const accessToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    const refreshToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    requester.request.mockResolvedValueOnce(authResponse(accessToken, refreshToken))

    await expect(manager.getAccessToken()).resolves.toBe(accessToken)
    await expect(manager.getAccessToken()).resolves.toBe(accessToken)

    expect(requester.request).toHaveBeenCalledTimes(1)
    const [key, request] = requester.request.mock.calls[0]
    expect(key).toMatch(/^amina-auth-login:/)
    expect(request).toMatchObject({
      method: 'POST',
      url: 'https://amina.test/api/b2c/v1/auth',
      data: { username: '25742014', password: 'password' },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    expect(request.headers?.['X-Request-Id']).toBeTruthy()
    expect(request.headers?.['X-Correlation-Id']).toBeTruthy()
  })

  it('refreshes an expired access token with the refresh token', async () => {
    const firstAccess = jwt({ amina_user_id: '25742014', exp: NOW_S + 1 })
    const firstRefresh = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    const secondAccess = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    const secondRefresh = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    requester.request
      .mockResolvedValueOnce(authResponse(firstAccess, firstRefresh))
      .mockResolvedValueOnce(authResponse(secondAccess, secondRefresh))

    await expect(manager.getAccessToken()).resolves.toBe(firstAccess)
    await expect(manager.getAccessToken()).resolves.toBe(secondAccess)

    expect(requester.request).toHaveBeenCalledTimes(2)
    const [, request] = requester.request.mock.calls[1]
    expect(request).toMatchObject({
      method: 'POST',
      url: 'https://amina.test/api/b2c/v1/auth',
      data: { refreshToken: firstRefresh },
    })
  })

  it('refreshes after a 401 and returns the new access token', async () => {
    const accessToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    const refreshToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    const refreshedAccess = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    requester.request
      .mockResolvedValueOnce(authResponse(accessToken, refreshToken))
      .mockResolvedValueOnce(authResponse(refreshedAccess, refreshToken))

    await manager.getAccessToken()
    await expect(manager.refreshAfter401()).resolves.toBe(refreshedAccess)

    expect(requester.request).toHaveBeenCalledTimes(2)
    const [, request] = requester.request.mock.calls[1]
    expect(request.data).toEqual({ refreshToken })
  })

  it('rejects an access token for a different AMINA user', async () => {
    const accessToken = jwt({ amina_user_id: '99999999', exp: NOW_S + 3600 })
    const refreshToken = jwt({ amina_user_id: '99999999', exp: NOW_S + 86400 })
    requester.request.mockResolvedValueOnce(authResponse(accessToken, refreshToken))

    await expect(manager.getAccessToken()).rejects.toThrow(
      'AMINA access token amina_user_id does not match AMINA_USER_ID',
    )
  })

  it('accepts an opaque access token and uses the configured user ID', async () => {
    requester.request.mockResolvedValueOnce(authResponse('opaque-access', 'opaque-refresh'))

    await expect(manager.getAccessToken()).resolves.toBe('opaque-access')
  })

  it('maps an auth 401 to a 502 AdapterError with the auth message', async () => {
    requester.request.mockRejectedValueOnce(authError(401))

    await expect(manager.getAccessToken()).rejects.toMatchObject({
      statusCode: 502,
      providerStatusCode: 401,
      message: 'AMINA auth failed with status 401',
    })
  })

  it('rejects an auth response without a refresh token', async () => {
    requester.request.mockResolvedValueOnce({
      response: {
        status: 200,
        data: {
          accessToken: jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 }),
        },
      },
      timestamps,
    })

    await expect(manager.getAccessToken()).rejects.toThrow(
      'AMINA auth response has no refreshToken',
    )
  })

  it('falls back to a full login when the refresh token is rejected', async () => {
    const firstAccess = jwt({ amina_user_id: '25742014', exp: NOW_S + 1 })
    const firstRefresh = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    const secondAccess = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    const secondRefresh = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    requester.request
      .mockResolvedValueOnce(authResponse(firstAccess, firstRefresh))
      .mockRejectedValueOnce(authError(401))
      .mockResolvedValueOnce(authResponse(secondAccess, secondRefresh))

    await expect(manager.getAccessToken()).resolves.toBe(firstAccess)
    await expect(manager.getAccessToken()).resolves.toBe(secondAccess)

    expect(requester.request).toHaveBeenCalledTimes(3)
    expect(requester.request.mock.calls[2][1].data).toEqual({
      username: '25742014',
      password: 'password',
    })
  })

  it('retries a connection error on the auth POST', async () => {
    const retrying = new AuthManager(requester as unknown as Requester, {
      apiEndpoint: 'https://amina.test',
      userId: '25742014',
      password: 'password',
      retry: { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 },
    })
    const accessToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 3600 })
    const refreshToken = jwt({ amina_user_id: '25742014', exp: NOW_S + 86400 })
    requester.request
      .mockRejectedValueOnce(connectionError())
      .mockResolvedValueOnce(authResponse(accessToken, refreshToken))

    const tokenPromise = retrying.getAccessToken()
    await jest.runAllTimersAsync()
    await expect(tokenPromise).resolves.toBe(accessToken)
    expect(requester.request).toHaveBeenCalledTimes(2)
  })
})
