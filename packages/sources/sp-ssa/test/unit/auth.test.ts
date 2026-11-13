import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { censor } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { AuthManager, AuthSettings } from '../../src/transport/auth'

const settings: AuthSettings = {
  TOKEN_ENDPOINT: 'http://token.com/token',
  CLIENT_ID: 'client-id',
}

const tokenResponse = (token: string, expiresIn = 1800) => ({
  response: { data: { access_token: token, expires_in: expiresIn }, status: 200 },
  timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
})

describe('AuthManager', () => {
  const t0 = 1_700_000_000_000
  let now = t0

  beforeEach(() => {
    now = t0
    jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([
    ['reuses a valid cached token', 1000, false, 1, 1800],
    ['refreshes inside the refresh margin', 1_500_001, false, 2, 1800],
    ['refreshes after invalidate', 1000, true, 2, 1800],
    ['reuses a short-lived token for half its lifetime', 61_000, false, 2, 120],
  ])('%s', async (_, advanceMs, invalidate, expectedCalls, expiresIn) => {
    const requester = makeStub('requester', { request: jest.fn() })
    requester.request.mockResolvedValue(tokenResponse('token-1', expiresIn))
    const manager = new AuthManager(requester as unknown as Requester, settings)

    await manager.getToken()
    now = t0 + advanceMs
    if (invalidate) {
      manager.invalidate()
    }
    await manager.getToken()

    expect(CensorList.getAll().some((entry) => entry.key === 'ACCESS_TOKEN')).toBe(true)
    const censored = censor({ headers: { authorization: 'Bearer token-1' } }, CensorList.getAll())
    expect(JSON.stringify(censored)).toContain('ACCESS_TOKEN REDACTED')
    expect(JSON.stringify(censored)).not.toContain('token-1')
    expect(requester.request).toHaveBeenCalledTimes(expectedCalls)
    expect(requester.request).toHaveBeenNthCalledWith(
      1,
      'sp-ssa-token',
      {
        method: 'POST',
        baseURL: 'http://token.com/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic client-id',
        },
        data: 'grant_type=client_credentials&scope=rtg_ssa',
      },
      0,
    )
  })

  it('redacts the access token after multiple refreshes', async () => {
    const requester = makeStub('requester', { request: jest.fn() })
    requester.request
      .mockResolvedValueOnce(tokenResponse('token-a'))
      .mockResolvedValueOnce(tokenResponse('token-b'))
      .mockResolvedValueOnce(tokenResponse('token-c'))
    const manager = new AuthManager(requester as unknown as Requester, settings)

    await manager.getToken()
    manager.invalidate()
    await manager.getToken()
    manager.invalidate()
    await manager.getToken()

    const entries = CensorList.getAll().filter((entry) => entry.key === 'ACCESS_TOKEN')
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.length).toBeLessThanOrEqual(4)
    const censoredA = censor({ headers: { authorization: 'Bearer token-b' } }, CensorList.getAll())
    expect(JSON.stringify(censoredA)).toContain('ACCESS_TOKEN REDACTED')
    expect(JSON.stringify(censoredA)).not.toContain('token-b')
  })

  it('shares one token request between concurrent callers', async () => {
    const requester = makeStub('requester', { request: jest.fn() })
    requester.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(tokenResponse('token-1')), 10)
        }),
    )
    const manager = new AuthManager(requester as unknown as Requester, settings)

    const [first, second] = await Promise.all([manager.getToken(), manager.getToken()])

    expect(first).toBe('token-1')
    expect(second).toBe('token-1')
    expect(requester.request).toHaveBeenCalledTimes(1)
  })

  it.each([
    [{ access_token: undefined, expires_in: 1800 }],
    [{ access_token: '', expires_in: 1800 }],
    [{ access_token: '   ', expires_in: 1800 }],
    [{ access_token: 'token', expires_in: 'abc' }],
    [{ access_token: 'token', expires_in: 0 }],
    [{ access_token: 'token', expires_in: true }],
  ])('rejects an unusable token response %p', async (body) => {
    const requester = makeStub('requester', { request: jest.fn() })
    requester.request.mockResolvedValue({
      response: { data: body, status: 200 },
      timestamps: { providerDataRequestedUnixMs: 1, providerDataReceivedUnixMs: 2 },
    })
    const manager = new AuthManager(requester as unknown as Requester, settings)

    await expect(manager.getToken()).rejects.toMatchObject({ statusCode: 502 })
  })
})
