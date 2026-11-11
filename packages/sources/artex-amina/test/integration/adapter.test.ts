import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { porTransport } from '../../src/transport/por'
import { DEFAULT_RETRY } from '../../src/transport/retry'
import {
  AGREEMENT,
  HOST,
  ISIN,
  mockAuth,
  mockAuthError,
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
    // Keep integration tests fast. Retry policy is covered in test/unit/transport.test.ts
    // and RETRY=0 startup rejection in test/unit/config.test.ts.
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-05T00:00:00Z').getTime())

    const adapter = (await import('../../src')).adapter
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
    mockPositions(0, page({ positions: [position(ISIN, 12345.6789)] }))

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

  it.each([
    ['twice on one page', [page({ positions: [position(ISIN, 12345.6789), position(ISIN, 1)] })]],
    [
      'across pages',
      [
        page({ positions: [position(ISIN, 12345.6789)], totalPages: 2, number: 0, last: false }),
        page({ positions: [position(ISIN, 1)], totalPages: 2, number: 1 }),
      ],
    ],
  ])('returns 502 when the ISIN appears %s', async (_, pages) => {
    pages.forEach((body, pageNo) => mockPositions(pageNo, body))

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

  it('returns 502 with the provider status and problem fields', async () => {
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
    expect(response.json().errorMessage).toBe(
      'AMINA request failed (500): Internal Server Error | instance-1',
    )
  })

  it('refreshes the token after a 401 and returns the position', async () => {
    mockPositionsError(0, 401)
    mockRefresh(REFRESHED_ACCESS_TOKEN)
    mockPositions(0, page({ positions: [position(ISIN, 12345.6789)] }), REFRESHED_ACCESS_TOKEN)

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.aum).toBe(12345.6789)
  })

  it('returns 502 when login is rejected', async () => {
    nock.cleanAll()
    mockAuthError(401, { title: 'Unauthorized' })

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toBe('AMINA request failed (401): Unauthorized')
  })

  it.each([
    ['portfolioNo', { portfolioNo: 1, isin: ISIN }],
    ['isin', { portfolioNo: PORTFOLIO_NO, isin: 'not-an-isin' }],
  ])('returns 400 for an invalid %s', async (field, data) => {
    nock.cleanAll()

    const response = await testAdapter.request({
      endpoint: 'por',
      ...data,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error?.message).toContain(field)
  })
})
