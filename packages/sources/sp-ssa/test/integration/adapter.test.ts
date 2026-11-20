import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  CLIENT_ID,
  mockBadTokenErrorPersisted,
  mockLoginSuccess,
  mockLoginSuccessPersisted,
  mockMissingApiKeyErrorPersisted,
  mockScoresSuccess,
  mockScoresSuccessPersisted,
} from './fixtures'

const ENV_KEYS = [
  'API_ENDPOINT',
  'AUTH_API_ENDPOINT',
  'SPGI_CLIENT_ID',
  'SPGI_APIKEY',
  'EA_PORT',
  'METRICS_ENABLED',
]

const BASE_NOW = new Date('2001-01-01T11:11:11.111Z').getTime()
const TOKEN_LIFETIME_MS = 3_600_000
const clockAt = (tokenLifetimes: number): number => BASE_NOW + tokenLifetimes * TOKEN_LIFETIME_MS

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
    // The repository's test script sets these; the file sets them itself so it
    // starts the same way when it is run alone.
    process.env.EA_PORT = '0'
    process.env.METRICS_ENABLED = 'false'

    spy = jest.spyOn(Date, 'now').mockReturnValue(BASE_NOW)

    if (!nock.isActive()) {
      nock.activate()
    }

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  // Each provider-failure case sets the clock one token lifetime past the
  // previous case and mocks its own login reply. The clock moves past the
  // token the previous case cached, so the case logs in for itself in file
  // order, and a case that runs alone starts from an empty token cache. The
  // timestamps in the snapshots are the clock values below.
  const freshLogin = (nowMs: number): nock.Scope => {
    spy.mockReturnValue(nowMs)
    return mockLoginSuccessPersisted()
  }

  afterAll(async () => {
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
    await testAdapter.api.close()
    nock.cleanAll()
    nock.restore()
    nock.enableNetConnect()
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
    const login = freshLogin(clockAt(1))
    mockScoresSuccessPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EUR' })

    expect(login.isDone()).toBe(true)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the reply is an empty list', async () => {
    const login = freshLogin(clockAt(2))
    mockScoresSuccessPersisted([])

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EMPTY' })

    expect(login.isDone()).toBe(true)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 when the reply is not a JSON array', async () => {
    const login = freshLogin(clockAt(3))
    mockScoresSuccessPersisted({})

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-OBJECT' })

    expect(login.isDone()).toBe(true)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 for the recorded bad-token 401', async () => {
    const login = freshLogin(clockAt(4))
    mockBadTokenErrorPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-BADTOKEN' })

    expect(login.isDone()).toBe(true)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns a 502 for the recorded missing-apikey 401', async () => {
    const login = freshLogin(clockAt(5))
    mockMissingApiKeyErrorPersisted()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-NOAPIKEY' })

    expect(login.isDone()).toBe(true)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  // The reply is an array of record objects (contract:114-130), so an element
  // that is not an object is a malformed payload (B-15) and is a 502 (B-18),
  // not the framework polling timeout.
  it('returns a 502 when the reply array has a null element', async () => {
    const login = freshLogin(clockAt(6))
    mockScoresSuccessPersisted([null])

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })

    expect(login.isDone()).toBe(true)
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
