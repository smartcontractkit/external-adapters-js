import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import { RateLimiter } from '@chainlink/external-adapter-framework/rate-limiting'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterRateLimitError } from '@chainlink/external-adapter-framework/validation/error'
import nock from 'nock'
import { config } from '../../src/config'
import { scoresFixture, tokenResponseBody } from '../fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

const dataPath = '/api/v1/ssa/getAllScores'

const restoreEnv = (oldEnv: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in oldEnv)) {
      delete process.env[key]
    }
  }
  setEnvVariables(oldEnv)
}

describe('ssa cache write policy', () => {
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv
  let limited = false
  let rateLimitRejections = 0

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  const mockToken = () =>
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()

  const mockScores = (body: unknown = scoresFixture(), status = 200): nock.Scope =>
    nock('http://api.com')
      .get(dataPath)
      .reply(status, body as unknown as nock.Body)
      .persist()

  const waitFor = async (condition: () => boolean, attempts = 100): Promise<void> => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (condition()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    expect(condition()).toBe(true)
  }

  const waitForStatus = async (security_id: string, statusCode: number) => {
    let response = await request(security_id)
    for (let attempt = 0; attempt < 100 && response.statusCode !== statusCode; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      response = await request(security_id)
    }
    return response
  }

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.CACHE_POLLING_SLEEP_MS = '10'
    process.env.API_TIMEOUT = '2000'
    process.env.RETRY = '0'
    delete process.env.ORIGIN

    const rateLimiter = {
      waitForRateLimit: jest.fn(async (cost?: number) => {
        if (limited && cost !== 0) {
          rateLimitRejections++
          throw new AdapterRateLimitError({ statusCode: 429, message: 'rate limited' })
        }
      }),
      msUntilNextExecution: () => 0,
    } as unknown as RateLimiter

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    mockToken()
    testAdapter = await TestAdapter.startWithMockedCache(
      adapter,
      { testAdapter: {} as TestAdapter<SettingsDefinition> },
      { rateLimiter },
    )
  })

  beforeEach(() => {
    limited = false
    rateLimitRejections = 0
    nock.cleanAll()
    mockToken()
  })

  afterAll(async () => {
    restoreEnv(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it.each([
    ['a provider error', 'SP-EURC', { message: 'provider failed' }, 500],
    ['a malformed payload', 'SP-EURCV', { message: 'not an array' }, 200],
  ])('replaces a cached success when the next reply is %s', async (_, securityId, body, status) => {
    mockScores()
    const first = await request(securityId)
    expect(first.statusCode).toBe(200)
    expect(first.json().result).toBe(securityId === 'SP-EURC' ? 2 : 3)

    nock.cleanAll()
    mockToken()
    mockScores(body, status)

    const response = await waitForStatus(securityId, 502)

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toBeTruthy()
  })

  it('keeps the last good value when the provider connection fails', async () => {
    mockScores()
    const first = await request('SP-GUSD')
    expect(first.statusCode).toBe(200)
    expect(first.json().result).toBe(3)

    nock.cleanAll()
    let errorRequests = 0
    const failing = nock('http://api.com').get(dataPath).replyWithError('socket hang up').persist()
    failing.on('request', () => {
      errorRequests++
    })

    await waitFor(() => errorRequests > 0)
    const response = await request('SP-GUSD')

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(3)
  })

  it('keeps the last good value when the framework rate limiter rejects the data request', async () => {
    mockScores()
    const first = await request('SP-TUSD')
    expect(first.statusCode).toBe(200)
    expect(first.json().result).toBe(5)

    limited = true
    await waitFor(() => rateLimitRejections > 0)
    const response = await request('SP-TUSD')

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(5)
  })
})
