import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createHmac } from 'crypto'
import {
  AminaAuth,
  AminaAuthSettings,
  login,
  requestIds,
  signRequest,
} from '../../src/transport/authentication'
import { AMINA_HOST, authBody, UUID_PATTERN } from '../fixtures/amina'

const noop = () => undefined
LoggerFactoryProvider.set({
  child: () => ({
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    msgPrefix: 'test',
  }),
})

type RequesterStub = { request: jest.Mock }
const makeRequester = (): RequesterStub => ({ request: jest.fn() })
const asRequester = (stub: RequesterStub): Requester => stub as unknown as Requester

const settings: AminaAuthSettings = {
  API_ENDPOINT: AMINA_HOST,
  AMINA_USER_ID: '12345678',
  AMINA_PASSWORD: 'super-secret-password',
  AMINA_HMAC_SECRET: 'super-secret-hmac',
  AMINA_AGREEMENT_NUMBER: '123456-1',
}

const authReply = (data: unknown) => ({ response: { data } })

describe('login', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('reports a rejected login as a provider error with the provider status and body', async () => {
    const requester = makeRequester()
    requester.request.mockRejectedValue(
      new AdapterError({
        statusCode: 502,
        providerStatusCode: 401,
        message: 'Request failed with status code 401',
        errorResponse: { title: 'Unauthorized', status: 401 },
      }),
    )

    const error = (await login(
      asRequester(requester),
      AMINA_HOST,
      settings.AMINA_USER_ID,
      settings.AMINA_PASSWORD,
    ).catch((caught: unknown) => caught)) as AdapterError

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.statusCode).toBe(502)
    expect(error.message).toContain('provider status 401')
    expect(error.message).toContain('"title":"Unauthorized"')
    // Only the authentication request is made: nothing is read from the
    // portfolio when the session cannot be opened.
    expect(requester.request).toHaveBeenCalledTimes(1)
    expect(requester.request.mock.calls[0][1].url).toBe('/api/b2c/v1/auth')
  })

  it.each([{}, { accessToken: 'only-an-access-token' }])(
    'rejects an authentication response without both tokens: %j',
    async (body) => {
      const requester = makeRequester()
      requester.request.mockResolvedValue(authReply(body))

      const error = (await login(
        asRequester(requester),
        AMINA_HOST,
        settings.AMINA_USER_ID,
        settings.AMINA_PASSWORD,
      ).catch((caught: unknown) => caught)) as AdapterError

      expect(error).toBeInstanceOf(AdapterError)
      expect(error.statusCode).toBe(502)
      expect(error.message).toContain('accessToken and refreshToken')
      expect(requester.request).toHaveBeenCalledTimes(1)
      expect(requester.request.mock.calls[0][1].url).toBe('/api/b2c/v1/auth')
    },
  )
})

describe('signRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('signs the documented HMAC message and returns the documented headers', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_123)
    const uri = '/api/b2c/v1/securities/portfolios/157769305/positions'

    const headers = signRequest({
      userId: settings.AMINA_USER_ID,
      hmacSecret: settings.AMINA_HMAC_SECRET,
      agreementNumber: settings.AMINA_AGREEMENT_NUMBER,
      uri,
    })

    expect(headers['Amina-Timestamp']).toBe('1700000000')
    expect(headers['Amina-Nonce']).toMatch(UUID_PATTERN)
    expect(headers['Amina-Uri']).toBe(uri)
    expect(headers['Amina-Uri']).not.toContain('?')
    expect(headers['Amina-Context-Agreement-Number']).toBe(settings.AMINA_AGREEMENT_NUMBER)

    const message = [
      'GET',
      '1700000000',
      headers['Amina-Nonce'],
      uri,
      settings.AMINA_USER_ID,
      settings.AMINA_AGREEMENT_NUMBER,
    ].join('\n')
    const expected = createHmac('sha256', settings.AMINA_HMAC_SECRET)
      .update(message)
      .digest('base64')
    expect(headers['Amina-Signature']).toBe(expected)
  })
})

describe('requestIds', () => {
  it('gives every provider request fresh request and correlation ids', () => {
    const first = requestIds()
    const second = requestIds()

    expect(first['X-Request-Id']).toMatch(UUID_PATTERN)
    expect(first['X-Correlation-Id']).toMatch(UUID_PATTERN)
    expect(second['X-Request-Id']).toMatch(UUID_PATTERN)
    expect(second['X-Correlation-Id']).toMatch(UUID_PATTERN)

    const ids = [
      first['X-Request-Id'],
      first['X-Correlation-Id'],
      second['X-Request-Id'],
      second['X-Correlation-Id'],
    ]
    expect(new Set(ids).size).toBe(4)
  })
})

describe('AminaAuth', () => {
  let requester: RequesterStub
  let now: number

  const respondWith = (replies: { login?: unknown[]; refresh?: unknown[] }) => {
    const logins = [...(replies.login ?? [authBody('1')])]
    const refreshes = [...(replies.refresh ?? [authBody('2')])]
    requester.request.mockImplementation((key: string) => {
      if (key === 'amina-auth-login') {
        const data = logins.length > 1 ? logins.shift() : logins[0]
        return Promise.resolve(authReply(data))
      }
      const data = refreshes.length > 1 ? refreshes.shift() : refreshes[0]
      return Promise.resolve(authReply(data))
    })
  }

  beforeEach(() => {
    jest.restoreAllMocks()
    requester = makeRequester()
    now = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('logs in once for a fresh session and reuses the token', async () => {
    respondWith({})
    const auth = new AminaAuth(asRequester(requester), settings)

    const first = await auth.getAccessToken()
    const second = await auth.getAccessToken()

    expect(first).toBe(authBody('1').accessToken)
    expect(second).toBe(first)
    expect(requester.request).toHaveBeenCalledTimes(1)
    expect(requester.request).toHaveBeenCalledWith(
      'amina-auth-login',
      expect.objectContaining({
        url: '/api/b2c/v1/auth',
        data: { username: settings.AMINA_USER_ID, password: settings.AMINA_PASSWORD },
      }),
    )
  })

  it('refreshes an access token that is near expiry', async () => {
    respondWith({})
    const auth = new AminaAuth(asRequester(requester), settings)

    expect(await auth.getAccessToken()).toBe(authBody('1').accessToken)

    now += 59 * 60 * 1000 + 1
    expect(await auth.getAccessToken()).toBe(authBody('2').accessToken)

    expect(requester.request).toHaveBeenCalledTimes(2)
    expect(requester.request).toHaveBeenNthCalledWith(
      2,
      'amina-auth-refresh',
      expect.objectContaining({
        url: '/api/b2c/v1/auth',
        data: { refreshToken: authBody('1').refreshToken },
      }),
    )

    // The refreshed token is stored and reused.
    expect(await auth.getAccessToken()).toBe(authBody('2').accessToken)
    expect(requester.request).toHaveBeenCalledTimes(2)
  })

  it('logs in again when the refresh is rejected', async () => {
    respondWith({ login: [authBody('1'), authBody('3')] })
    requester.request
      .mockImplementationOnce(() => Promise.resolve(authReply(authBody('1'))))
      .mockRejectedValueOnce(
        new AdapterError({
          statusCode: 502,
          providerStatusCode: 401,
          message: 'Request failed with status code 401',
          errorResponse: { title: 'Unauthorized', status: 401 },
        }),
      )
      .mockImplementationOnce(() => Promise.resolve(authReply(authBody('3'))))

    const auth = new AminaAuth(asRequester(requester), settings)
    expect(await auth.getAccessToken()).toBe(authBody('1').accessToken)

    now += 59 * 60 * 1000 + 1
    expect(await auth.getAccessToken()).toBe(authBody('3').accessToken)

    expect(requester.request.mock.calls.map((call) => call[0])).toEqual([
      'amina-auth-login',
      'amina-auth-refresh',
      'amina-auth-login',
    ])
    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      'amina-auth-login',
      expect.objectContaining({
        data: { username: settings.AMINA_USER_ID, password: settings.AMINA_PASSWORD },
      }),
    )
  })

  it('logs in again when the refresh token is near its 24 hour expiry', async () => {
    respondWith({ login: [authBody('1'), authBody('3')] })
    const auth = new AminaAuth(asRequester(requester), settings)
    expect(await auth.getAccessToken()).toBe(authBody('1').accessToken)

    now += 24 * 60 * 60 * 1000 - 60 * 1000 + 1
    expect(await auth.getAccessToken()).toBe(authBody('3').accessToken)

    expect(requester.request.mock.calls.map((call) => call[0])).toEqual([
      'amina-auth-login',
      'amina-auth-login',
    ])
  })
})
