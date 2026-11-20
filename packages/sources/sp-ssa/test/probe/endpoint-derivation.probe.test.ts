import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { LOGIN_RESPONSE, SSA_SCORES_RESPONSE } from '../fixtures/provider'
import { API_KEY, CLIENT_ID } from '../integration/fixtures'

const SCORES_ORIGIN = 'http://scores.test'
const SCORES_BASE = `${SCORES_ORIGIN}/base`
const LOGIN_ORIGIN = 'http://login.test'
const LOGIN_URL = `${LOGIN_ORIGIN}/custom/token`

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('probe: endpoint derivation', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = SCORES_BASE
    process.env.AUTH_API_ENDPOINT = LOGIN_URL
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

  it('appends the scores path to the configured base and uses the token URL verbatim', async () => {
    const login = nock(LOGIN_ORIGIN)
      .post('/custom/token')
      .matchHeader('authorization', `Basic ${CLIENT_ID}`)
      .reply(200, LOGIN_RESPONSE)
    const scores = nock(SCORES_ORIGIN)
      .get('/base/api/v1/ssa/getAllScores')
      .matchHeader('authorization', `Bearer ${LOGIN_RESPONSE.access_token}`)
      .matchHeader('apikey', API_KEY)
      .matchHeader('accept', 'application/json')
      .reply(200, SSA_SCORES_RESPONSE)

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })

    expect(login.isDone()).toBe(true)
    expect(scores.isDone()).toBe(true)
    expect(response.statusCode).toBe(200)
    expect(response.json().data.exchangeRate).toBe(2)
  })
})
