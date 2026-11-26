import { censor } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager } from '../../src/transport/auth'

const NOW = new Date('2026-11-05T00:00:00Z').getTime()
const HOUR_MS = 60 * 60 * 1000
const ORIGINAL_CENSOR_LIST = CensorList.getAll()
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const timestamps = {
  providerDataRequestedUnixMs: 1,
  providerDataReceivedUnixMs: 2,
  providerIndicatedTimeUnixMs: undefined,
}

function authResponse(accessToken: string, refreshToken: string) {
  return {
    response: { status: 200, data: { accessToken, refreshToken } },
    timestamps,
  }
}

function providerError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    { statusCode: 502, providerStatusCode: status, message: `status ${status}` },
    timestamps,
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
    CensorList.set(ORIGINAL_CENSOR_LIST)
    jest.useRealTimers()
  })

  it('logs in with the documented credentials and reuses the access token', async () => {
    requester.request.mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    await expect(manager.getAccessToken()).resolves.toBe('access-1')

    expect(requester.request).toHaveBeenCalledTimes(1)
    const [, request] = requester.request.mock.calls[0]
    expect(request).toMatchObject({
      method: 'POST',
      url: 'https://amina.test/api/b2c/v1/auth',
      data: { username: '25742014', password: 'password' },
    })
    expect(request.headers?.['X-Request-Id']).toMatch(UUID)
    expect(request.headers?.['X-Correlation-Id']).toMatch(UUID)
  })

  it('registers the runtime tokens with the framework censor list', async () => {
    requester.request.mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))

    await manager.getAccessToken()

    const censored = censor(
      { Authorization: 'Bearer access-1', refreshToken: 'refresh-1' },
      CensorList.getAll(),
    ) as { Authorization: string; refreshToken: string }
    expect(censored.Authorization).not.toContain('access-1')
    expect(censored.refreshToken).not.toContain('refresh-1')
  })

  it('shares one login across concurrent callers', async () => {
    let resolveLogin!: (value: ReturnType<typeof authResponse>) => void
    const login = new Promise<ReturnType<typeof authResponse>>((resolve) => {
      resolveLogin = resolve
    })
    requester.request.mockReturnValueOnce(login)

    const first = manager.getAccessToken()
    const second = manager.getAccessToken()
    resolveLogin(authResponse('access-1', 'refresh-1'))

    await expect(Promise.all([first, second])).resolves.toEqual(['access-1', 'access-1'])
    expect(requester.request).toHaveBeenCalledTimes(1)
  })

  it('refreshes after the access token TTL and rotates the refresh token', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))
      .mockResolvedValueOnce(authResponse('access-3', 'refresh-3'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 2 * HOUR_MS))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')
    jest.setSystemTime(new Date(NOW + 4 * HOUR_MS))
    await expect(manager.getAccessToken()).resolves.toBe('access-3')

    expect(requester.request.mock.calls[1][1].data).toEqual({ refreshToken: 'refresh-1' })
    expect(requester.request.mock.calls[2][1].data).toEqual({ refreshToken: 'refresh-2' })
  })

  it('logs in again after the refresh token expires', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 25 * HOUR_MS))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')

    expect(requester.request.mock.calls[1][1].data).toEqual({
      username: '25742014',
      password: 'password',
    })
  })

  it('falls back to a full login when the refresh token is rejected', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockRejectedValueOnce(providerError(401))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 2 * HOUR_MS))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')

    expect(requester.request.mock.calls[1][1].data).toEqual({ refreshToken: 'refresh-1' })
    expect(requester.request.mock.calls[2][1].data).toEqual({
      username: '25742014',
      password: 'password',
    })
  })

  it('rejects an auth response without an access token with a 502', async () => {
    requester.request.mockResolvedValueOnce({
      response: { status: 200, data: { refreshToken: 'refresh-1' } },
      timestamps,
    })

    await expect(manager.getAccessToken()).rejects.toMatchObject({
      statusCode: 502,
      message: 'AMINA auth response must contain accessToken and refreshToken',
    })
  })
})
