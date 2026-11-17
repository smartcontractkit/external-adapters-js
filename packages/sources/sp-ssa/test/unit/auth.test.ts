import { censor } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager, AuthSettings } from '../../src/transport/auth'
import { fetchScoresWithReauth } from '../../src/transport/request'
import { scoresFixture, tokenResponseBody } from '../fixtures'

const tokenSettings: AuthSettings = {
  TOKEN_ENDPOINT: 'http://token.com/token',
  CLIENT_ID: 'client-id',
}

const scoresSettings = {
  API_ENDPOINT: 'http://api.com',
  API_KEY: 'api-key',
}

const t0 = 1_700_000_000_000
const tokenTimestamps = {
  providerDataRequestedUnixMs: 11,
  providerDataReceivedUnixMs: 12,
}
const errorTimestamps = {
  providerDataRequestedUnixMs: 31,
  providerDataReceivedUnixMs: 32,
  providerIndicatedTimeUnixMs: undefined,
}

const tokenReply = (token: string, expiresIn: unknown = 3600) => ({
  response: {
    data: { ...tokenResponseBody, access_token: token, expires_in: expiresIn },
    status: 200,
  },
  timestamps: tokenTimestamps,
})

const scoresReply = () => ({
  response: { data: scoresFixture(), status: 200 },
  timestamps: { providerDataRequestedUnixMs: 21, providerDataReceivedUnixMs: 22 },
})

const unauthorized = (status: 401 | 403) =>
  new AdapterDataProviderError(
    {
      statusCode: 502,
      message: status === 401 ? 'Unauthorized' : 'Forbidden',
      providerStatusCode: status,
    },
    errorTimestamps,
  )

describe('AuthManager', () => {
  let now = t0
  let request: jest.Mock

  const manager = () => new AuthManager({ request } as unknown as Requester, tokenSettings)

  const advance = (milliseconds: number) => {
    now = t0 + milliseconds
  }

  beforeEach(() => {
    now = t0
    request = jest.fn()
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    CensorList.set([])
  })

  afterEach(() => {
    jest.restoreAllMocks()
    CensorList.set([])
  })

  it('redacts a minted bearer token', async () => {
    request.mockResolvedValue(tokenReply('minted-secret-abc'))
    const auth = manager()

    await auth.getToken()

    const entries = CensorList.getAll().filter(({ key }) => key === 'ACCESS_TOKEN')
    expect(entries.some(({ value }) => value.test('minted-secret-abc'))).toBe(true)
    expect(
      censor({ headers: { authorization: 'Bearer minted-secret-abc' } }, CensorList.getAll()),
    ).toEqual({ headers: { authorization: 'Bearer [ACCESS_TOKEN REDACTED]' } })
  })

  it('caches the recorded token reply and reuses it inside the refresh margin', async () => {
    request.mockResolvedValue(tokenReply('token-1'))
    const auth = manager()

    expect(await auth.getToken()).toBe('token-1')
    advance(60_000)
    expect(await auth.getToken()).toBe('token-1')

    expect(request).toHaveBeenCalledTimes(1)
  })

  it('caps a 3600-second expires_in at thirty minutes', async () => {
    request
      .mockResolvedValueOnce(tokenReply('token-1'))
      .mockResolvedValueOnce(tokenReply('token-2'))
    const auth = manager()

    await auth.getToken()
    advance(30 * 60_000)

    expect(await auth.getToken()).toBe('token-2')
    expect(request).toHaveBeenCalledTimes(2)
    expect(await auth.getToken()).toBe('token-2')
  })

  it('honours a short expires_in at half its lifetime', async () => {
    request
      .mockResolvedValueOnce(tokenReply('token-1', 120))
      .mockResolvedValueOnce(tokenReply('token-2', 120))
    const auth = manager()

    await auth.getToken()
    advance(59_000)
    expect(await auth.getToken()).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(1)

    advance(60_000)
    expect(await auth.getToken()).toBe('token-2')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['not a number', 'abc'],
    ['not an integer', 1.5],
  ])(
    'rejects a token reply whose expires_in is %s before any data request',
    async (_, expiresIn) => {
      request.mockResolvedValue(tokenReply('token-1', expiresIn))

      await expect(
        fetchScoresWithReauth(
          { request } as unknown as Requester,
          scoresSettings,
          manager(),
          'sp-ssa-data',
        ),
      ).rejects.toMatchObject({ statusCode: 502, message: expect.stringContaining('token') })
      expect(request).toHaveBeenCalledTimes(1)
    },
  )

  it('reuses a token that is inside its refresh window', async () => {
    request.mockResolvedValue(tokenReply('token-1', 120))
    const auth = manager()

    await auth.getToken()
    advance(30_000)

    expect(await auth.getToken()).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('replaces a token at its refresh time', async () => {
    request
      .mockResolvedValueOnce(tokenReply('token-1', 120))
      .mockResolvedValueOnce(tokenReply('token-2', 120))
    const auth = manager()

    await auth.getToken()
    advance(60_000)

    expect(await auth.getToken()).toBe('token-2')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('keeps a still-valid token when the refresh fails and retries after thirty seconds', async () => {
    request
      .mockResolvedValueOnce(tokenReply('token-1', 120))
      .mockRejectedValueOnce(new AdapterError({ statusCode: 502, message: 'refresh failed' }))
      .mockResolvedValueOnce(tokenReply('token-2', 120))
    const auth = manager()

    await auth.getToken()
    advance(60_000)
    expect(await auth.getToken()).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(2)

    advance(60_000 + 29_999)
    expect(await auth.getToken()).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(2)

    advance(60_000 + 30_000)
    expect(await auth.getToken()).toBe('token-2')
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('surfaces the mint error when the refresh fails after expiry', async () => {
    request
      .mockResolvedValueOnce(tokenReply('token-1', 120))
      .mockRejectedValueOnce(
        new AdapterError({ statusCode: 502, message: 'token endpoint failed' }),
      )
    const auth = manager()

    await auth.getToken()
    advance(180_000)

    await expect(auth.getToken()).rejects.toMatchObject({
      statusCode: 502,
      message: 'token endpoint failed',
    })
  })

  it('shares one token request between concurrent callers', async () => {
    let resolveToken!: (value: unknown) => void
    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToken = resolve
        }),
    )
    const auth = manager()

    const first = auth.getToken()
    const second = auth.getToken()
    resolveToken(tokenReply('token-1'))

    await expect(Promise.all([first, second])).resolves.toEqual(['token-1', 'token-1'])
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('fetchScoresWithReauth', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(t0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('recovers one 401 with a fresh token', async () => {
    const request = jest.fn()
    request
      .mockResolvedValueOnce(tokenReply('token-1'))
      .mockRejectedValueOnce(unauthorized(401))
      .mockResolvedValueOnce(tokenReply('token-2'))
      .mockResolvedValueOnce(scoresReply())

    const response = await fetchScoresWithReauth(
      { request } as unknown as Requester,
      scoresSettings,
      new AuthManager({ request } as unknown as Requester, tokenSettings),
      'sp-ssa-data',
    )

    expect(response.response.status).toBe(200)
    expect(request).toHaveBeenCalledTimes(4)
    expect(request.mock.calls[3][1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer token-2' }),
    })
  })

  it.each([401, 403] as const)('reports a persistent %i as an auth error', async (status) => {
    const request = jest.fn()
    request
      .mockResolvedValueOnce(tokenReply('token-1'))
      .mockRejectedValueOnce(unauthorized(status))
      .mockResolvedValueOnce(tokenReply('token-2'))
      .mockRejectedValueOnce(unauthorized(status))

    await expect(
      fetchScoresWithReauth(
        { request } as unknown as Requester,
        scoresSettings,
        new AuthManager({ request } as unknown as Requester, tokenSettings),
        'sp-ssa-data',
      ),
    ).rejects.toMatchObject({
      statusCode: 502,
      providerStatusCode: status,
    })
  })

  it('reports a token endpoint non-200 as an auth error before any data request', async () => {
    const request = jest.fn().mockResolvedValue({
      response: { status: 401, data: { code: 401, message: 'Unauthorized' } },
      timestamps: tokenTimestamps,
    })

    await expect(
      fetchScoresWithReauth(
        { request } as unknown as Requester,
        scoresSettings,
        new AuthManager({ request } as unknown as Requester, tokenSettings),
        'sp-ssa-data',
      ),
    ).rejects.toMatchObject({
      statusCode: 502,
      providerStatusCode: 401,
      message: expect.stringContaining('status 401'),
    })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'a connection error',
      new AdapterConnectionError({ statusCode: 502, message: 'timeout' }, errorTimestamps),
      502,
    ],
    ['a rate limit', new AdapterRateLimitError({ statusCode: 429, message: 'rate limited' }), 429],
  ])('surfaces a token endpoint %s', async (_, error, statusCode) => {
    const request = jest.fn().mockRejectedValue(error)
    const auth = new AuthManager({ request } as unknown as Requester, tokenSettings)

    await expect(
      fetchScoresWithReauth(
        { request } as unknown as Requester,
        scoresSettings,
        auth,
        'sp-ssa-data',
      ),
    ).rejects.toMatchObject({
      statusCode,
      ...(statusCode === 502 ? { timestamps: errorTimestamps } : {}),
    })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['an empty body', {}],
    ['an empty access token', { access_token: '', expires_in: 3600 }],
    ['a missing expires_in', { access_token: 'token' }],
  ])('reports a usable token reply with %s as an auth error', async (_, body) => {
    const request = jest.fn().mockResolvedValue({
      response: { status: 200, data: body },
      timestamps: tokenTimestamps,
    })

    await expect(
      fetchScoresWithReauth(
        { request } as unknown as Requester,
        scoresSettings,
        new AuthManager({ request } as unknown as Requester, tokenSettings),
        'sp-ssa-data',
      ),
    ).rejects.toMatchObject({ statusCode: 502, message: expect.stringContaining('token') })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
