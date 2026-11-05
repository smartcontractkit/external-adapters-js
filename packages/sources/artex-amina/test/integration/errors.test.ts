import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { porTransport } from '../../src/transport/por'
import {
  AGREEMENT,
  HOST,
  ISIN,
  jwt,
  mockAuth,
  mockPositions,
  mockPositionsError,
  mockRefresh,
  PORTFOLIO_NO,
  page,
  position,
  REFRESH_TOKEN,
  USER_AGENT,
} from './fixtures'

const REFRESHED_ACCESS_TOKEN = jwt({
  amina_user_id: '25742014',
  exp: Math.floor(Date.now() / 1000) + 3600,
})

describe('execute errors', () => {
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

  beforeEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
    porTransport.authManager.reset()
    mockAuth()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('returns 502 when the ISIN is absent', async () => {
    mockPositions(0, page({ positions: [position('OTHER', 1)] }))

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('No AMINA position found for ISIN US0378331005')
  })

  it('returns 502 when the ISIN appears twice on one page', async () => {
    mockPositions(
      0,
      page({
        positions: [position(ISIN, 100.5), position(ISIN, 1)],
      }),
    )

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain(
      'Duplicate AMINA position found for ISIN US0378331005',
    )
  })

  it('returns 502 when the ISIN appears on more than one page', async () => {
    mockPositions(
      0,
      page({
        positions: [position(ISIN, 100.5)],
        totalPages: 2,
        last: false,
        number: 0,
      }),
    )
    mockPositions(
      1,
      page({
        positions: [position(ISIN, 1)],
        totalPages: 2,
        last: true,
        number: 1,
      }),
    )

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain(
      'Duplicate AMINA position found for ISIN US0378331005',
    )
  })

  it('returns 502 when the provider returns 500', async () => {
    mockPositionsError(0, 500, {
      title: 'Internal Server Error',
      detail: 'boom',
      instance: 'instance-1',
    })

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('AMINA request failed (500)')
    expect(response.json().errorMessage).toContain('Internal Server Error')
  })

  it('returns 502 when the provider quantity is not a number', async () => {
    mockPositions(
      0,
      page({
        positions: [{ isin: ISIN, quantity: '100' }],
      }),
    )

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('invalid quantity')
  })

  it('refreshes the token after a 401 and retries the page', async () => {
    mockPositionsError(0, 401)
    mockRefresh(REFRESHED_ACCESS_TOKEN, REFRESH_TOKEN)
    mockPositions(0, page({ positions: [position(ISIN, 100.5)] }), REFRESHED_ACCESS_TOKEN)

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.aum).toBe(100.5)
  })
})
