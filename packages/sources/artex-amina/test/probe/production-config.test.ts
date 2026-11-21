import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
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

const PRODUCTION_HOST = 'https://integration.aminagroup.io'

describe('production configuration', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    delete process.env.API_ENDPOINT
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

  it('starts with the production host and serves reserves from it', async () => {
    const portfolio = '920000001'
    mockAuth(PRODUCTION_HOST)
    mockPositions(portfolio, 0, ONE_MATCH_PAGE, 200, DATE_HEADER, PRODUCTION_HOST)

    expect(config.settings.API_ENDPOINT).toBe(PRODUCTION_HOST)

    const response = await testAdapter.request({
      endpoint: 'reserves',
      portfolio,
      isin: MATCHING_ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(123.4567)
  })
})
