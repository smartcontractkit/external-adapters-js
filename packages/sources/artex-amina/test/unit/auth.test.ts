import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager } from '../../src/transport/auth'

const NOW = new Date('2026-11-05T00:00:00Z').getTime()
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function authResponse(accessToken: string, refreshToken: string) {
  return {
    response: { status: 200, data: { accessToken, refreshToken } },
    timestamps: {
      providerDataRequestedUnixMs: 1,
      providerDataReceivedUnixMs: 2,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}

function providerError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    { statusCode: 502, providerStatusCode: status, message: `status ${status}` },
    {
      providerDataRequestedUnixMs: 1,
      providerDataReceivedUnixMs: 2,
      providerIndicatedTimeUnixMs: undefined,
    },
  )
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
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('logs in and reuses the access token', async () => {
    requester.request.mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    await expect(manager.getAccessToken()).resolves.toBe('access-1')

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
    expect(request.headers?.['X-Request-Id']).toMatch(UUID)
    expect(request.headers?.['X-Correlation-Id']).toMatch(UUID)
  })

  it.each([
    ['a non-object response', null],
    ['a response without an access token', { refreshToken: 'refresh-1' }],
    ['a response without a refresh token', { accessToken: 'access-1' }],
  ])('rejects %s', async (_, data) => {
    requester.request.mockResolvedValueOnce({
      response: { status: 200, data },
      timestamps: {
        providerDataRequestedUnixMs: 1,
        providerDataReceivedUnixMs: 2,
        providerIndicatedTimeUnixMs: undefined,
      },
    })

    await expect(manager.getAccessToken()).rejects.toThrow(
      'AMINA auth response must contain accessToken and refreshToken',
    )
  })

  it('refreshes the access token after one hour and stores the rotated refresh token', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))
      .mockResolvedValueOnce(authResponse('access-3', 'refresh-3'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 2 * 60 * 60 * 1000))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')
    jest.setSystemTime(new Date(NOW + 4 * 60 * 60 * 1000))
    await expect(manager.getAccessToken()).resolves.toBe('access-3')

    expect(requester.request).toHaveBeenCalledTimes(3)
    const [key, request] = requester.request.mock.calls[1]
    expect(key).toMatch(/^amina-auth-refresh:/)
    expect(request.data).toEqual({ refreshToken: 'refresh-1' })
    expect(requester.request.mock.calls[2][1].data).toEqual({ refreshToken: 'refresh-2' })
  })

  it('falls back to a full login when the refresh token is rejected', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockRejectedValueOnce(providerError(401))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 2 * 60 * 60 * 1000))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')

    expect(requester.request).toHaveBeenCalledTimes(3)
    expect(requester.request.mock.calls[1][1].data).toEqual({ refreshToken: 'refresh-1' })
    expect(requester.request.mock.calls[2][1].data).toEqual({
      username: '25742014',
      password: 'password',
    })
  })

  it('retries an auth server error and then succeeds', async () => {
    requester.request
      .mockRejectedValueOnce(providerError(500))
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))

    const token = manager.getAccessToken()
    await Promise.resolve()
    await jest.runAllTimersAsync()

    await expect(token).resolves.toBe('access-1')
    expect(requester.request).toHaveBeenCalledTimes(2)
  })
})
