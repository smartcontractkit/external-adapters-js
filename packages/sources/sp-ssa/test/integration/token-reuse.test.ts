import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { LOGIN_RESPONSE } from '../fixtures/provider'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  AUTH_ORIGIN,
  CLIENT_ID,
  mockScoresSuccessPersisted,
} from './fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('token reuse', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = API_ENDPOINT
    process.env.AUTH_API_ENDPOINT = AUTH_ENDPOINT
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

  it('logs in once and reuses the token for the next provider call', async () => {
    let logins = 0
    nock(AUTH_ORIGIN)
      .post('/gettoken/token')
      .matchHeader('authorization', `Basic ${CLIENT_ID}`)
      .reply(200, () => {
        logins += 1
        return LOGIN_RESPONSE
      })
      .persist()
    mockScoresSuccessPersisted()

    const first = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })
    expect(first.statusCode).toBe(200)
    expect(first.json()).toMatchSnapshot()

    const second = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-TUSD' })
    expect(second.statusCode).toBe(200)
    expect(second.json()).toMatchSnapshot()

    expect(logins).toBe(1)
  })
})
