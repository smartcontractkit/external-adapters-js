import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { AGREEMENT, HOST, ISIN, PORTFOLIO_NO, USER_AGENT } from './fixtures'

describe('execute validation', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = HOST
    process.env.AMINA_USER_ID = '25742014'
    process.env.AMINA_PASSWORD = 'password'
    process.env.AMINA_HMAC_SECRET = 'hmac-secret'
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT
    process.env.AMINA_USER_AGENT = USER_AGENT
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.MAX_ATTEMPTS = '1'
    process.env.RETRY_BASE_DELAY_MS = '0'
    process.env.RETRY_MAX_DELAY_MS = '0'

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it.each([
    ['portfolioNo', { portfolioNo: 1, isin: ISIN }],
    ['isin', { portfolioNo: PORTFOLIO_NO, isin: 'bad' }],
  ])('returns 400 for an invalid %s', async (field, data) => {
    const response = await testAdapter.request({
      endpoint: 'por',
      ...data,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error?.message).toContain(field)
  })
})
