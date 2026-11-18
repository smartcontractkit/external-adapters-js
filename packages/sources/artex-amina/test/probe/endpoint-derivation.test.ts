import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  AGREEMENT_NUMBER,
  DATE_HEADER,
  HMAC_SECRET,
  MATCHING_ISIN,
  ONE_MATCH_PAGE,
  PASSWORD,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions } from '../integration/fixtures'

const OVERRIDE_HOST = 'https://sandbox.example.test'

describe('endpoint derivation', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = OVERRIDE_HOST
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

  it('derives the auth and positions URLs from API_ENDPOINT', async () => {
    const portfolio = '920000002'
    const auth = mockAuth(OVERRIDE_HOST)
    const page = mockPositions(portfolio, 0, ONE_MATCH_PAGE, 200, DATE_HEADER, OVERRIDE_HOST)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(123.4567)
    expect(auth.isDone()).toBe(true)
    expect(page.isDone()).toBe(true)
  })
})
