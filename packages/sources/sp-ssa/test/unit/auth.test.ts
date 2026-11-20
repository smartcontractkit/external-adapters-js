import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { censor } from '@chainlink/external-adapter-framework/util/logger'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager, AuthResponseSchema, AuthSettings } from '../../src/transport/auth'
import { LOGIN_RESPONSE } from '../fixtures/provider'

const AUTH_URL = 'http://auth.test/gettoken/token'

const settings: AuthSettings = {
  AUTH_API_ENDPOINT: AUTH_URL,
  SPGI_CLIENT_ID: 'test-client-id',
  BACKGROUND_EXECUTE_MS_HTTP: 1000,
}

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

const formFields = (request: any): Record<string, string> => {
  const body = request.data ?? request.form
  if (typeof body === 'string') {
    return Object.fromEntries(new URLSearchParams(body).entries())
  }
  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries())
  }
  return body ?? {}
}

const authResponse = (fields: { access_token?: string; expires_in?: number } = {}) =>
  ({ ...LOGIN_RESPONSE, ...fields } as AuthResponseSchema)

const requesterResult = (data: unknown, status = 200) =>
  ({
    response: { status, data },
    timestamps: { providerDataRequestedUnixMs: 0, providerDataReceivedUnixMs: 0 },
  } as any)

describe('AuthManager', () => {
  const requesterRequest = jest.fn()
  const requester = { request: requesterRequest } as unknown as Requester
  let authManager: AuthManager

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    authManager = new AuthManager(requester, settings)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('posts the client-credentials login with Basic client id and the rtg_ssa scope', async () => {
    requesterRequest.mockResolvedValue(requesterResult(authResponse()))

    const token = await authManager.getBearerToken()

    expect(token).toBe(LOGIN_RESPONSE.access_token)
    expect(requesterRequest).toHaveBeenCalledTimes(1)

    const request = requesterRequest.mock.calls[0][1]
    expect(providerUrl(request)).toBe(AUTH_URL)
    expect(request.method?.toUpperCase()).toBe('POST')
    expect(headerValue(request.headers, 'authorization')).toBe('Basic test-client-id')
    expect(headerValue(request.headers, 'content-type')).toContain(
      'application/x-www-form-urlencoded',
    )
    expect(formFields(request)).toEqual({
      grant_type: 'client_credentials',
      scope: 'rtg_ssa',
    })
  })

  it('reuses the token until two background cycles before the recorded 1800 s mark', async () => {
    requesterRequest
      .mockResolvedValueOnce(requesterResult(authResponse({ access_token: 'token-1' })))
      .mockResolvedValueOnce(requesterResult(authResponse({ access_token: 'token-2' })))

    expect(await authManager.getBearerToken()).toBe('token-1')

    jest.advanceTimersByTime(1_797_000)
    expect(await authManager.getBearerToken()).toBe('token-1')
    expect(requesterRequest).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1_001)
    expect(await authManager.getBearerToken()).toBe('token-2')
    expect(requesterRequest).toHaveBeenCalledTimes(2)
  })

  it('uses a shorter expires_in instead of the 1800 s mark', async () => {
    requesterRequest
      .mockResolvedValueOnce(
        requesterResult(authResponse({ access_token: 'short-1', expires_in: 60 })),
      )
      .mockResolvedValueOnce(
        requesterResult(authResponse({ access_token: 'short-2', expires_in: 60 })),
      )

    expect(await authManager.getBearerToken()).toBe('short-1')

    jest.advanceTimersByTime(57_000)
    expect(await authManager.getBearerToken()).toBe('short-1')
    expect(requesterRequest).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1_001)
    expect(await authManager.getBearerToken()).toBe('short-2')
    expect(requesterRequest).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['access_token', { token_type: 'Bearer', expires_in: 3600, scope: 'rtg_ssa' }],
    ['expires_in', { token_type: 'Bearer', access_token: 'replay-credential', scope: 'rtg_ssa' }],
  ])('rejects a login reply without %s with a 502', async (_field, reply) => {
    requesterRequest.mockResolvedValue(requesterResult(reply))

    const promise = authManager.getBearerToken()
    await expect(promise).rejects.toBeInstanceOf(AdapterError)
    await expect(promise).rejects.toMatchObject({ statusCode: 502 })
    expect(requesterRequest).toHaveBeenCalledTimes(1)
  })

  it('registers the issued token in the censor list and redacts it', async () => {
    CensorList.set([])
    const issuedToken = 'issued-token-6a1f'
    requesterRequest.mockResolvedValue(requesterResult(authResponse({ access_token: issuedToken })))

    const token = await authManager.getBearerToken()

    const entry = CensorList.getAll().find((item) => item.key === 'SPGI_ACCESS_TOKEN')
    expect(entry?.value.test(token)).toBe(true)

    const censored = censor(
      { authorization: `Bearer ${token}`, message: `token=${token}` },
      CensorList.getAll(),
    )
    expect(censored).toEqual({
      authorization: 'Bearer [SPGI_ACCESS_TOKEN REDACTED]',
      message: 'token=[SPGI_ACCESS_TOKEN REDACTED]',
    })
    expect(JSON.stringify(censored)).not.toContain(token)
  })
})
