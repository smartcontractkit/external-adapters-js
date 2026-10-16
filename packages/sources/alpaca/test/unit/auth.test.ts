import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { censor } from '@chainlink/external-adapter-framework/util/logger'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import { getAccessToken } from '../../src/transport/auth'
import { authenticate } from '../../src/transport/stock_quotes'
import {
  ACCESS_TOKEN,
  AUTH_ENDPOINT,
  CLIENT_ID,
  CLIENT_SECRET,
  clearLogs,
  loggedText,
  makeConnection,
  mockLogger,
} from './fixtures'

const logger = mockLogger()

type RequestConfig = Parameters<Requester['request']>[1]

const settings = { AUTH_ENDPOINT, CLIENT_ID, CLIENT_SECRET } as unknown as typeof config.settings

// Stands in for the framework Requester: records the outbound request, replies with tokenBody
const makeRequester = (tokenBody: unknown) => {
  const requests: RequestConfig[] = []
  const requester = {
    request: async (_key: string, req: RequestConfig) => {
      requests.push(req)
      return { response: { status: 200, data: tokenBody } }
    },
  } as unknown as Requester
  return { requester, requests }
}

const headerOf = (req: RequestConfig, name: string) =>
  Object.entries(req.headers ?? {}).find(([key]) => key.toLowerCase() === name)?.[1]

// Spec data_source_authentication.credentials (token_request, token_response)
describe('getAccessToken', () => {
  beforeEach(() => clearLogs(logger))

  it('posts client_credentials form body to AUTH_ENDPOINT and returns access_token', async () => {
    const { requester, requests } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    const token = await getAccessToken(settings, requester)

    expect(token).toBe(ACCESS_TOKEN)
    expect(requests).toHaveLength(1)
    const [req] = requests
    expect(req.url).toBe(AUTH_ENDPOINT)
    expect(req.method?.toUpperCase()).toBe('POST')
    expect(headerOf(req, 'content-type')).toBe('application/x-www-form-urlencoded')
    const form = Object.fromEntries(new URLSearchParams(req.data))
    expect(form.grant_type).toBe('client_credentials')
    expect(form.client_id).toBe(CLIENT_ID)
    expect(form.client_secret).toBe(CLIENT_SECRET)
  })

  // The spec gives no token endpoint timeout; the framework Requester applies API_TIMEOUT
  it('token request sets no per-request timeout override', async () => {
    const { requester, requests } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    await getAccessToken(settings, requester)

    expect(requests[0].timeout).toBeUndefined()
  })

  // Spec refresh_policy per_connect: two connects make two token requests, no token caching
  it('makes one token request per call without caching the token', async () => {
    const { requester, requests } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    await getAccessToken(settings, requester)
    await getAccessToken(settings, requester)

    expect(requests).toHaveLength(2)
  })

  it('returns access_token from the token response', async () => {
    const { requester } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    expect(await getAccessToken(settings, requester)).toBe(ACCESS_TOKEN)
  })

  // iss pre-check: a token issued by a DIFFERENT host than AUTH_ENDPOINT is the sandbox-in-
  // production misconfiguration class — fail fast and name both hosts (URLs are not secrets)
  it('rejects a token issued by a different host than AUTH_ENDPOINT', async () => {
    const b64url = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url')
    const prodToken = `abc.${b64url({ iss: 'https://authx.fake-alt.test/' })}.sig`
    const { requester } = makeRequester({ access_token: prodToken, expires_in: 900 })

    const error = (await getAccessToken(settings, requester).catch((e) => e)) as AdapterError

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.statusCode).toBe(502)
    expect(error.message).toContain('different host')
    expect(error.message).toContain('authx.fake.test')
    expect(error.message).not.toContain(prodToken)
  })

  it('accepts a token issued by the AUTH_ENDPOINT host', async () => {
    const b64url = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url')
    const sandboxToken = `abc.${b64url({ iss: 'https://authx.fake.test/' })}.sig`
    const { requester } = makeRequester({ access_token: sandboxToken, expires_in: 900 })

    expect(await getAccessToken(settings, requester)).toBe(sandboxToken)
  })

  it('throws without the secret when access_token is missing', async () => {
    const { requester } = makeRequester({ expires_in: 900 })

    const error = await getAccessToken(settings, requester).catch((e: Error) => e)

    expect(error).toBeInstanceOf(Error)
    expect(String((error as Error).message)).not.toContain(CLIENT_SECRET)
  })

  // The framework Requester error keeps the axios error as cause, whose config.data is the form
  // body with client_secret
  it('throws without leaking secret on non-2xx', async () => {
    const form = `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    const requesterError = new AdapterDataProviderError(
      {
        statusCode: 502,
        providerStatusCode: 401,
        message: 'Request failed with status code 401',
        cause: { config: { data: form }, response: { status: 401 } },
      },
      {} as never,
    )
    const requester = {
      request: async () => {
        throw requesterError
      },
    } as unknown as Requester

    const error = (await getAccessToken(settings, requester).catch((e) => e)) as AdapterError

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.statusCode).toBe(502)
    expect(error.message).toBe('Alpaca OAuth token request failed with status 401')
    expect(JSON.stringify({ ...error, message: error.message })).not.toContain(CLIENT_SECRET)
    expect(JSON.stringify(error.cause ?? null)).not.toContain(CLIENT_SECRET)
    expect(loggedText(logger)).not.toContain(CLIENT_SECRET)
  })

  // CLIENT_SECRET is sensitive: the form-encoded token request body must be censored by the
  // framework censor list too, not only the raw value
  it('encoded client secret is censored', async () => {
    const oldEnv = { ...process.env }
    const oldCensorList = CensorList.getAll()
    const rawSecret = 'a+b/c=d'
    const encodedSecret = 'a%2Bb%2Fc%3Dd'
    try {
      process.env['CLIENT_ID'] = CLIENT_ID
      process.env['CLIENT_SECRET'] = rawSecret
      config.initialize()
      config.validate()
      config.buildCensorList()
      const { requester, requests } = makeRequester({
        access_token: ACCESS_TOKEN,
        expires_in: 900,
      })

      await getAccessToken(config.settings, requester)

      expect(requests).toHaveLength(1)
      expect(String(requests[0].data)).toContain(encodedSecret)
      const censored = JSON.stringify(censor(requests[0].data, CensorList.getAll()))
      expect(censored).not.toContain(rawSecret)
      expect(censored).not.toContain(encodedSecret)
    } finally {
      process.env = oldEnv
      CensorList.set(oldCensorList)
    }
  })

  // Reference defect 2: the access token leaked through console.log
  it('logs neither the access token nor the client secret', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const { requester } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    try {
      await getAccessToken(settings, requester)

      const logged = loggedText(logger) + JSON.stringify(consoleLog.mock.calls)
      expect(logged).not.toContain(ACCESS_TOKEN)
      expect(logged).not.toContain(CLIENT_SECRET)
    } finally {
      consoleLog.mockRestore()
    }
  })
})

// Spec token_usage.ws_auth_message and sample_response ([{"T":"success","msg":"authenticated"}]).
// The ~10 s auth deadline is the framework WS_CONNECTION_OPEN_TIMEOUT around the open handler
// (owner decision reconnect_backoff=cut), so authenticate keeps no timer of its own.
describe('authenticate', () => {
  const AUTH_MESSAGE = { action: 'auth', key: 'access_token', secret: ACCESS_TOKEN }

  beforeEach(() => clearLogs(logger))

  it('authenticate resolves on authenticated frame', async () => {
    const { connection, sent, listenerCount } = makeConnection([
      { T: 'success', msg: 'connected' },
      { T: 'success', msg: 'authenticated' },
    ])

    await expect(authenticate(connection, ACCESS_TOKEN)).resolves.toBeUndefined()

    expect(sent).toEqual([AUTH_MESSAGE])
    // No listener cleanup by design (Alejo's simplification): the listener dies with the
    // connection and the framework's open timeout bounds the wait.
  })

  // Provider error frame fields are provider-controlled: they must not reach the error message text
  it('authenticate rejects on error frame', async () => {
    const { connection, sent, listenerCount } = makeConnection([
      { T: 'error', code: 402, msg: 'auth failed\nFAKE LOG ENTRY' },
    ])

    const error = await authenticate(connection, ACCESS_TOKEN).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain('\n')
    expect((error as Error).message).not.toContain('FAKE LOG ENTRY')
    expect(sent).toEqual([AUTH_MESSAGE])
  })

  it('authenticate registers no timer', () => {
    jest.useFakeTimers()
    try {
      // The provider answers nothing, so authenticate stays pending
      const { connection, sent } = makeConnection([])

      void authenticate(connection, ACCESS_TOKEN)

      expect(sent).toEqual([AUTH_MESSAGE])
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })
})
