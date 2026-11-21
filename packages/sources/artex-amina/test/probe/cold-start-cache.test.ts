import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  AGREEMENT_NUMBER,
  API_HOST,
  HMAC_SECRET,
  MATCHING_ISIN,
  ONE_MATCH_PAGE,
  PASSWORD,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions } from '../integration/fixtures'

describe('cold start and cache polling', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = API_HOST
    process.env.AMINA_USER_ID = USER_ID
    process.env.AMINA_PASSWORD = PASSWORD
    process.env.AMINA_HMAC_SECRET = HMAC_SECRET
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT_NUMBER
    process.env.BACKGROUND_EXECUTE_MS = '100000'

    nock.disableNetConnect()
    const adapter = (await import('../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    if (testAdapter) {
      await testAdapter.api.close()
    }
    nock.enableNetConnect()
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('fetches once on a cold start and serves the next request from cache', async () => {
    const portfolio = '920000003'
    let authCalls = 0
    let pageCalls = 0

    mockAuth()
      .persist()
      .on('request', () => authCalls++)
    mockPositions(portfolio, 0, ONE_MATCH_PAGE)
      .persist()
      .on('request', () => pageCalls++)

    const data = { endpoint: 'reserves', portfolio, isin: MATCHING_ISIN }
    const first = await testAdapter.request(data)
    const second = await testAdapter.request(data)

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect(second.json()).toEqual(first.json())
    expect(authCalls).toBe(1)
    expect(pageCalls).toBe(1)
  })
})
