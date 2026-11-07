import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { porTransport } from '../../src/transport/por'
import { DEFAULT_RETRY } from '../../src/transport/utils'
import {
  AGREEMENT,
  HOST,
  ISIN,
  mockAuth,
  mockPositions,
  mockPositionsError,
  mockRefresh,
  page,
  PORTFOLIO_NO,
  position,
} from './fixtures'

const REFRESHED_ACCESS_TOKEN = 'refreshed-access-token'

describe('execute', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let dateSpy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = HOST
    process.env.AMINA_USER_ID = '25742014'
    process.env.AMINA_PASSWORD = 'password'
    process.env.AMINA_HMAC_SECRET = 'hmac-secret'
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '10'
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-05T00:00:00Z').getTime())

    const adapter = (await import('../../src')).adapter
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
    dateSpy.mockRestore()
    Object.assign(DEFAULT_RETRY, { maxAttempts: 3, baseDelayMs: 2_000, maxDelayMs: 40_000 })
  })

  it('returns the selected position as aum', async () => {
    mockPositions(0, page({ positions: [position(ISIN, 100.5)] }))

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
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
    mockPositions(0, page({ positions: [position(ISIN, 100.5), position(ISIN, 1)] }))

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
    mockPositions(0, page({ positions: [position(ISIN, 100.5)], last: false }))
    mockPositions(1, page({ positions: [position(ISIN, 1)] }))

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

  it('refreshes the token after a 401 and retries the page', async () => {
    mockPositionsError(0, 401)
    mockRefresh(REFRESHED_ACCESS_TOKEN)
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
