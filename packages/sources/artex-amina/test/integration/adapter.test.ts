import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { DEFAULT_RETRY } from '../../src/transport/utils'
import {
  AGREEMENT,
  HOST,
  ISIN,
  mockAuth,
  mockPositions,
  page,
  PORTFOLIO_NO,
  position,
} from './fixtures'

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
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-05T00:00:00Z').getTime())

    const adapter = (await import('../../src')).adapter
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
    dateSpy.mockRestore()
    Object.assign(DEFAULT_RETRY, { maxAttempts: 3, baseDelayMs: 2_000, maxDelayMs: 40_000 })
  })

  it('returns the selected position as aum', async () => {
    mockAuth()
    mockPositions(0, page({ positions: [position(ISIN, 100.5)] }))

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it.each([
    ['portfolioNo', { portfolioNo: 1, isin: ISIN }],
    ['isin', { portfolioNo: PORTFOLIO_NO, isin: 'bad' }],
  ])('rejects an invalid %s', async (field, data) => {
    const response = await testAdapter.request({ endpoint: 'por', ...data })

    expect(response.statusCode).toBe(400)
    expect(response.json().error?.message).toContain(field)
  })
})
