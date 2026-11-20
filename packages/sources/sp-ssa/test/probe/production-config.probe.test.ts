import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { LOGIN_RESPONSE, SSA_SCORES_RESPONSE } from '../fixtures/provider'
import { API_KEY, CLIENT_ID } from '../integration/fixtures'

const PRODUCTION_API = 'https://api.glb.prod.ratings.spglobal.com'
const PRODUCTION_API_ENDPOINT = `${PRODUCTION_API}/ssa-defiscoreapi/extoauthv2`
const PRODUCTION_API_PATH = '/ssa-defiscoreapi/extoauthv2/api/v1/ssa/getAllScores'
const PRODUCTION_AUTH = 'https://secureapi.signin.spglobal.com'
const PRODUCTION_AUTH_PATH = '/gettoken/token'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('probe: production config startup', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = PRODUCTION_API_ENDPOINT
    process.env.AUTH_API_ENDPOINT = `${PRODUCTION_AUTH}${PRODUCTION_AUTH_PATH}`
    process.env.SPGI_CLIENT_ID = CLIENT_ID
    process.env.SPGI_APIKEY = API_KEY

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

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
    spy.mockRestore()
  })

  it('starts with production settings and serves the ssa endpoint', async () => {
    const login = nock(PRODUCTION_AUTH)
      .post(PRODUCTION_AUTH_PATH)
      .matchHeader('authorization', `Basic ${CLIENT_ID}`)
      .reply(200, LOGIN_RESPONSE)
    const scores = nock(PRODUCTION_API)
      .get(PRODUCTION_API_PATH)
      .matchHeader('authorization', `Bearer ${LOGIN_RESPONSE.access_token}`)
      .matchHeader('apikey', API_KEY)
      .reply(200, SSA_SCORES_RESPONSE)

    const health = await testAdapter.getHealth()
    expect(health.statusCode).toBe(200)

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })

    expect(login.isDone()).toBe(true)
    expect(scores.isDone()).toBe(true)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })
})
