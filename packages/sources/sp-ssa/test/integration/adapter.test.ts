import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  CLIENT_ID,
  mockBadTokenErrorPersisted,
  mockLoginSuccess,
  mockMissingApiKeyErrorPersisted,
  mockScoresSuccess,
  mockScoresSuccessPersisted,
} from './fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('execute', () => {
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

  it('returns the brief response for SP-EURC', async () => {
    const login = mockLoginSuccess()
    const scores = mockScoresSuccess()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })

    expect(login.isDone()).toBe(true)
    expect(scores.isDone()).toBe(true)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the reply has no record for the security_id', async () => {
    mockScoresSuccessPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EUR' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the reply is an empty list', async () => {
    mockScoresSuccessPersisted([])

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EMPTY' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the reply is not a JSON array', async () => {
    mockScoresSuccessPersisted({ code: 500, message: 'malformed' })

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-OBJECT' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 for the recorded bad-token 401', async () => {
    mockBadTokenErrorPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-BADTOKEN' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 for the recorded missing-apikey 401', async () => {
    mockMissingApiKeyErrorPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-NOAPIKEY' })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 400 when security_id is missing', async () => {
    const response = await testAdapter.request({ endpoint: 'ssa' })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.message).toContain('security_id')
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 400 when security_id is not a string', async () => {
    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 123 })

    expect(response.statusCode).toBe(400)
    expect(response.json().error.message).toContain('security_id')
    expect(response.json()).toMatchSnapshot()
  })
})
