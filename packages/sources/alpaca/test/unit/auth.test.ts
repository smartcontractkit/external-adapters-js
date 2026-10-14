import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../../src/config'
import { getAccessToken } from '../../src/transport/auth'
import {
  ACCESS_TOKEN,
  AUTH_ENDPOINT,
  CLIENT_ID,
  CLIENT_SECRET,
  clearLogs,
  loggedText,
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

  it('POSTs the client-credentials form to AUTH_ENDPOINT', async () => {
    const { requester, requests } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    await getAccessToken(settings, requester)

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

  it('returns access_token from the token response', async () => {
    const { requester } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    expect(await getAccessToken(settings, requester)).toBe(ACCESS_TOKEN)
  })

  it('throws without the secret when access_token is missing', async () => {
    const { requester } = makeRequester({ expires_in: 900 })

    const error = await getAccessToken(settings, requester).catch((e: Error) => e)

    expect(error).toBeInstanceOf(Error)
    expect(String((error as Error).message)).not.toContain(CLIENT_SECRET)
  })

  // The framework Requester error keeps the axios error as cause, whose config.data is the form
  // body with client_secret
  it('token request failure does not leak client_secret', async () => {
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

  // A redirect would replay the client secret to a host outside AUTH_ENDPOINT
  it('token request does not follow redirects', async () => {
    const { requester, requests } = makeRequester({ access_token: ACCESS_TOKEN, expires_in: 900 })

    await getAccessToken(settings, requester)

    expect(requests[0].maxRedirects).toBe(0)
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
