import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { BAD_TOKEN_RESPONSE, LOGIN_RESPONSE } from '../fixtures/provider'
import {
  API_ENDPOINT,
  API_KEY,
  API_ORIGIN,
  AUTH_ENDPOINT,
  AUTH_ORIGIN,
  CLIENT_ID,
  SCORES_PATH,
} from '../integration/fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

// The framework polls the response cache at most 10 times, 200 ms apart:
// a provider failure cached after that window reaches the caller as a 504.
const CACHE_POLL_BUDGET_MS = 10 * 200

describe('probe: retry override', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = API_ENDPOINT
    process.env.AUTH_API_ENDPOINT = AUTH_ENDPOINT
    process.env.SPGI_CLIENT_ID = CLIENT_ID
    process.env.SPGI_APIKEY = API_KEY

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('keeps RETRY at 0 and serves a provider failure as a 502 before the cache poll budget', async () => {
    expect(config.settings.RETRY).toBe(0)

    let scoresRequests = 0
    const login = nock(AUTH_ORIGIN).post('/gettoken/token').reply(200, LOGIN_RESPONSE)
    nock(API_ORIGIN)
      .get(SCORES_PATH)
      .times(2)
      .reply(401, () => {
        scoresRequests += 1
        return BAD_TOKEN_RESPONSE
      })

    const startedAt = Date.now()
    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-BADTOKEN' })
    const elapsedMs = Date.now() - startedAt
    const body = response.json()

    expect(login.isDone()).toBe(true)
    // RETRY=0: one provider attempt; the next background execution is the retry.
    expect(scoresRequests).toBe(1)
    expect(elapsedMs).toBeLessThan(CACHE_POLL_BUDGET_MS)
    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toBe('Request failed with status code 401')
    expect(body).not.toHaveProperty('result')
  })
})
