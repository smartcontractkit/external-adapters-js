import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AuthManager } from '../../src/transport/auth'

const NOW = new Date('2026-11-05T00:00:00Z').getTime()
const NOW_S = Math.floor(NOW / 1000)

function jwt(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`
}

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
    })
  })

  it('refreshes an expired access token', async () => {
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
    expect(requester.request.mock.calls[1][1].data).toEqual({ refreshToken: firstRefresh })
  })

  it('rejects an access token for a different AMINA user', async () => {
    const accessToken = jwt({ amina_user_id: '99999999', exp: NOW_S + 3600 })
    const refreshToken = jwt({ amina_user_id: '99999999', exp: NOW_S + 86400 })
    requester.request.mockResolvedValueOnce(authResponse(accessToken, refreshToken))

    await expect(manager.getAccessToken()).rejects.toThrow(
      'AMINA access token amina_user_id does not match AMINA_USER_ID',
    )
  })

  it('accepts an opaque access token', async () => {
    requester.request.mockResolvedValueOnce(authResponse('opaque-access', 'opaque-refresh'))

    await expect(manager.getAccessToken()).resolves.toBe('opaque-access')
  })
})
