import type { TestAdapter as TestAdapterType } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { BAD_TOKEN_RESPONSE, LOGIN_RESPONSE } from '../fixtures/provider'

const CLIENT_ID_VALUE = 'probe-client-id-8f3c1a'
const API_KEY_VALUE = 'probe-apikey-4b7d2e'
const ACCESS_TOKEN_VALUE = 'probe-access-token-9c5e0d'

const AUTH_ORIGIN = 'http://auth.test'
const AUTH_ENDPOINT = `${AUTH_ORIGIN}/gettoken/token`
const API_ORIGIN = 'http://api.test'
const SCORES_PATH = '/api/v1/ssa/getAllScores'

const ENV_KEYS = [
  'API_ENDPOINT',
  'AUTH_API_ENDPOINT',
  'SPGI_CLIENT_ID',
  'SPGI_APIKEY',
  'LOG_LEVEL',
  'CENSOR_SENSITIVE_LOGS',
]

const LOGIN_WITH_TOKEN = { ...LOGIN_RESPONSE, access_token: ACCESS_TOKEN_VALUE }

interface ScenarioResult {
  logs: string
  statusCode: number
  body: Record<string, unknown>
  bodyText: string
}

// Runs a fresh module graph so the framework logger is built at the requested
// level. The issued token is distinctive, so any leak is unambiguous.
const runScenario = async (logLevel?: string): Promise<ScenarioResult> => {
  jest.resetModules()

  process.env.API_ENDPOINT = API_ORIGIN
  process.env.AUTH_API_ENDPOINT = AUTH_ENDPOINT
  process.env.SPGI_CLIENT_ID = CLIENT_ID_VALUE
  process.env.SPGI_APIKEY = API_KEY_VALUE
  delete process.env.CENSOR_SENSITIVE_LOGS
  if (logLevel === undefined) {
    delete process.env.LOG_LEVEL
  } else {
    process.env.LOG_LEVEL = logLevel
  }

  const chunks: string[] = []
  const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk))
    return true
  }) as never)
  const stderr = jest.spyOn(process.stderr, 'write').mockImplementation(((chunk: unknown) => {
    chunks.push(String(chunk))
    return true
  }) as never)

  let testAdapter: TestAdapterType | undefined
  try {
    const { TestAdapter } = await import('@chainlink/external-adapter-framework/util/testing-utils')
    const { adapter } = await import('../../src')
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapterType<never>,
    })

    const login = nock(AUTH_ORIGIN).post('/gettoken/token').reply(200, LOGIN_WITH_TOKEN)
    const scores = nock(API_ORIGIN).get(SCORES_PATH).reply(401, BAD_TOKEN_RESPONSE)

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })

    expect(login.isDone()).toBe(true)
    expect(scores.isDone()).toBe(true)

    return {
      logs: chunks.join(''),
      statusCode: response.statusCode,
      body: response.json(),
      bodyText: response.body,
    }
  } finally {
    stdout.mockRestore()
    stderr.mockRestore()
    if (testAdapter) {
      await testAdapter.api.close()
    }
    nock.cleanAll()
  }
}

describe('probe: secret logging', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = { ...process.env }
  })

  afterAll(() => {
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
    nock.restore()
    nock.cleanAll()
  })

  it.each([
    ['default', undefined],
    ['trace', 'trace'],
  ])(
    'does not log the issued token, client id or apikey at the %s level',
    async (_label, logLevel) => {
      const result = await runScenario(logLevel as string | undefined)

      // The scenario is not vacuous: the failure is logged and, at trace, the
      // framework Requester line is present.
      expect(result.logs).toContain('Request failed with status code 401')
      if (logLevel === 'trace') {
        expect(result.logs).toContain('"layer":"Requester"')
      }

      for (const secret of [ACCESS_TOKEN_VALUE, CLIENT_ID_VALUE, API_KEY_VALUE]) {
        expect(result.logs).not.toContain(secret)
        expect(result.bodyText).not.toContain(secret)
      }

      expect(result.statusCode).toBe(502)
      expect(result.body).not.toHaveProperty('result')
    },
  )
})
