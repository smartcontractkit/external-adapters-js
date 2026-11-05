import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AuthManager } from '../../src/transport/auth'

const NOW = new Date('2026-11-05T00:00:00Z').getTime()

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
    })
  })

  it('refreshes the access token after one hour', async () => {
    requester.request
      .mockResolvedValueOnce(authResponse('access-1', 'refresh-1'))
      .mockResolvedValueOnce(authResponse('access-2', 'refresh-2'))

    await expect(manager.getAccessToken()).resolves.toBe('access-1')
    jest.setSystemTime(new Date(NOW + 2 * 60 * 60 * 1000))
    await expect(manager.getAccessToken()).resolves.toBe('access-2')

    expect(requester.request).toHaveBeenCalledTimes(2)
    const [key, request] = requester.request.mock.calls[1]
    expect(key).toMatch(/^amina-auth-refresh:/)
    expect(request.data).toEqual({ refreshToken: 'refresh-1' })
  })
})
