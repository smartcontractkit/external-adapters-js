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
  PASSWORD,
  SCALED_PAGE,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions } from '../integration/fixtures'

describe('numeric scaling', () => {
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

  it('publishes the quantity at the provider scale with no scaling or rounding', async () => {
    const portfolio = '920000004'
    mockAuth()
    mockPositions(portfolio, 0, SCALED_PAGE)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.result).toBe(250.5)
    expect(body.data.result).toBe(250.5)
    expect(body.data.aum).toBe(250.5)
  })
})
