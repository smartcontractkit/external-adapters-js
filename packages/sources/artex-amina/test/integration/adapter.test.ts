import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  AGREEMENT,
  HOST,
  ISIN,
  mockAuth,
  mockPositions,
  PORTFOLIO_NO,
  page,
  position,
  USER_AGENT,
} from './fixtures'

describe('execute', () => {
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

  it('returns the selected position as aum with source timestamps', async () => {
    mockAuth()
    mockPositions(
      0,
      page({
        positions: [position(ISIN, 100.5)],
      }),
    )

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.result).toBe(100.5)
    expect(body.data.aum).toBe(100.5)
    expect(body.data.ripcord).toBe(0)
    expect(body.data.navPerShare).toBe(0)
    expect(body.data.navDate).toBe(0)
    expect(body.data.nativeFee).toBe(0)
    expect(body.data.linkFee).toBe(0)
    expect(body.timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(
      body.timestamps.providerDataRequestedUnixMs,
    )
  })
})
