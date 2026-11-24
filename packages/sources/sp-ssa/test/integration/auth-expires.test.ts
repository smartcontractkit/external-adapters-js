import type { TestAdapter as TestAdapterType } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  CLIENT_ID,
  mockLoginResponsePersisted,
  mockScoresSuccessPersisted,
} from './fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

const BASE_NOW = new Date('2001-01-01T11:11:11.111Z').getTime()

// Each case starts a fresh module graph: a token cached by an earlier case
// (including the NaN expiry that the defect caches) cannot satisfy this case.
const runExpiresInCase = async (expiresIn: unknown) => {
  jest.resetModules()
  const { TestAdapter } = await import('@chainlink/external-adapter-framework/util/testing-utils')
  const { adapter } = await import('../../src')
  adapter.rateLimiting = undefined
  const testAdapter = await TestAdapter.startWithMockedCache(adapter, {
    testAdapter: {} as TestAdapterType<never>,
  })
  try {
    const login = mockLoginResponsePersisted(200, {
      token_type: 'Bearer',
      access_token: 'replay-credential',
      expires_in: expiresIn,
      scope: 'rtg_ssa',
    })
    const scores = mockScoresSuccessPersisted()

    const response = await testAdapter.request({
      endpoint: 'ssa',
      security_id: 'SP-BADEXPIRY',
    })
    // Read the scopes before the cleanup in `finally` clears them.
    return {
      loginDone: login.isDone(),
      scoresDone: scores.isDone(),
      response,
    }
  } finally {
    await testAdapter.api.close()
    nock.cleanAll()
  }
}

describe('auth expires_in', () => {
  let spy: jest.SpyInstance
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = API_ENDPOINT
    process.env.AUTH_API_ENDPOINT = AUTH_ENDPOINT
    process.env.SPGI_CLIENT_ID = CLIENT_ID
    process.env.SPGI_APIKEY = API_KEY

    spy = jest.spyOn(Date, 'now').mockReturnValue(BASE_NOW)
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
    spy.mockRestore()
  })

  it.each([
    ['a numeric string', '3600'],
    ['a non-numeric string', 'abc'],
    ['null', null],
    ['zero', 0],
    ['a negative number', -1],
  ])('returns a 502 when the login expires_in is %s', async (_label, expiresIn) => {
    const { loginDone, scoresDone, response } = await runExpiresInCase(expiresIn)

    expect(loginDone).toBe(true)
    // The token is never used: the login reply is rejected before the scores call.
    expect(scoresDone).toBe(false)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })
})
