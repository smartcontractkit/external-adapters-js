import { Requester } from '@chainlink/external-adapter-framework/util/requester'

const URL = 'https://fake-url'
const KEY = 'base64-credentials'
const EXPIRES_IN_SECONDS = 3600

const expectedRequestConfig = {
  method: 'POST',
  baseURL: URL,
  url: 'gettoken/token',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${KEY}`,
  },
  data: 'grant_type=client_credentials&scope=rtg_ssa',
}

describe('getToken', () => {
  let request: jest.Mock
  let requester: Requester
  let getToken: typeof import('../../src/lib/auth').getToken

  const mockTokenResponse = (data: Record<string, unknown> | Promise<Record<string, unknown>>) => {
    request.mockImplementationOnce(async () => ({
      response: {
        data: await data,
      },
    }))
  }

  beforeEach(async () => {
    jest.resetModules()
    jest.useFakeTimers()

    request = jest.fn()
    requester = { request } as unknown as Requester
    // Re-import the module for every test because the token cache lives at module scope.
    ;({ getToken } = await import('../../src/lib/auth'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should request and return an access token', async () => {
    mockTokenResponse({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: EXPIRES_IN_SECONDS,
      scope: 'rtg_ssa',
    })

    const token = await getToken(URL, KEY, requester)

    expect(token).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(URL, expectedRequestConfig)
  })

  it('should reuse the cached token until it is close to expiring', async () => {
    mockTokenResponse({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: EXPIRES_IN_SECONDS,
      scope: 'rtg_ssa',
    })

    expect(await getToken(URL, KEY, requester)).toBe('token-1')

    // Cached until one minute before expiry.
    jest.advanceTimersByTime((EXPIRES_IN_SECONDS - 60) * 1000 - 1)
    expect(await getToken(URL, KEY, requester)).toBe('token-1')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('should request a new token after the cached one expires', async () => {
    mockTokenResponse({
      access_token: 'token-1',
      token_type: 'Bearer',
      expires_in: EXPIRES_IN_SECONDS,
      scope: 'rtg_ssa',
    })
    mockTokenResponse({
      access_token: 'token-2',
      token_type: 'Bearer',
      expires_in: EXPIRES_IN_SECONDS,
      scope: 'rtg_ssa',
    })

    expect(await getToken(URL, KEY, requester)).toBe('token-1')

    jest.advanceTimersByTime((EXPIRES_IN_SECONDS - 60) * 1000)
    expect(await getToken(URL, KEY, requester)).toBe('token-2')
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('should throw if the response does not include an access token', async () => {
    mockTokenResponse({ error: 'invalid_client' })

    await expect(getToken(URL, KEY, requester)).rejects.toThrow(
      'Failed to obtain access token: {"error":"invalid_client"}',
    )
    expect(request).toHaveBeenCalledTimes(1)
  })
})
