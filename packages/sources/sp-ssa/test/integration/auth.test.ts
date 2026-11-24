import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  CLIENT_ID,
  mockLoginResponsePersisted,
} from './fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('auth', () => {
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

  beforeEach(() => {
    nock.cleanAll()
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

  it('returns a 502 when the login answers a non-200', async () => {
    mockLoginResponsePersisted(401, {
      code: 401,
      message: 'Unauthorized',
    })

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-AUTH-401' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the login reply has no access_token', async () => {
    mockLoginResponsePersisted(200, {
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'rtg_ssa',
    })

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-NOTOKEN' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the login reply has no expires_in', async () => {
    mockLoginResponsePersisted(200, {
      token_type: 'Bearer',
      access_token: 'replay-credential',
      scope: 'rtg_ssa',
    })

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-NOEXPIRY' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })
})
