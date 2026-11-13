import type { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import type { BaseEndpointTypes } from '../../src/endpoint/por'
import { inputParameters } from '../../src/endpoint/por'
import { porTransport } from '../../src/transport/por'
import { DEFAULT_RETRY } from '../../src/transport/retry'
import {
  ACCESS_TOKEN,
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
  let originalRetry: typeof DEFAULT_RETRY
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
    originalRetry = { ...DEFAULT_RETRY }
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
    Object.assign(DEFAULT_RETRY, originalRetry)
  })

  it('returns the selected position as aum', async () => {
    mockPositions(0, page({ positions: [position(ISIN, 12345.6789)] }))

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.result).toBe(12345.6789)
    expect(body.data).toMatchObject({
      result: 12345.6789,
      aum: 12345.6789,
      ripcord: false,
      ripcordAsInt: 0,
      navPerShare: 0,
      navDate: 0,
      nativeFee: 0,
      linkFee: 0,
    })
    expect(body.timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(
      body.timestamps.providerDataRequestedUnixMs,
    )
    expect(body.timestamps.providerDataReceivedUnixMs).toBeGreaterThanOrEqual(
      body.timestamps.providerDataRequestedUnixMs,
    )
    expect(body).toMatchSnapshot()
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

  it.each([
    [
      500,
      { title: 'Internal Server Error', detail: 'boom', instance: 'instance-1' },
      'AMINA request failed (500): Internal Server Error | instance-1',
    ],
    // 403 means a bad signature or path, so it must surface directly. A token
    // refresh would consume no auth mock and change this to a connection error.
    [403, { title: 'Forbidden' }, 'AMINA request failed (403): Forbidden'],
  ])(
    'returns 502 with the provider status and problem fields for a %i response',
    async (status, body, message) => {
      mockPositionsError(0, status, body)

      const response = await testAdapter.request({
        endpoint: 'por',
        portfolioNo: PORTFOLIO_NO,
        isin: ISIN,
      })

      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(message)
      expect(response.json().timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
      expect(response.json().timestamps.providerDataReceivedUnixMs).toBeGreaterThan(0)
    },
  )

  it('preserves a live report when a later scan fails', async () => {
    let positionsCalls = 0
    mockPositions(
      0,
      page({ positions: [position(ISIN, 12345.6789)] }),
      ACCESS_TOKEN,
      () => (positionsCalls += 1),
    ).persist()

    const first = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })
    expect(first.statusCode).toBe(200)
    expect(positionsCalls).toBe(1)

    nock.cleanAll()
    mockPositionsError(0, 500)

    const context = {
      endpointName: 'por',
      inputParameters,
      adapterSettings: porTransport.settings,
    } as unknown as EndpointContext<BaseEndpointTypes>
    await porTransport.handleRequest({ portfolioNo: PORTFOLIO_NO, isin: ISIN }, context)

    const cache = testAdapter.mockCache?.cache
    const entry = [...(cache?.values() ?? [])][0] as
      | { data: { expirationTimestamp: number } }
      | undefined
    expect(entry).toBeDefined()
    const remainingTtl = entry ? entry.data.expirationTimestamp - Date.now() : 0
    expect(remainingTtl).toBeGreaterThan(300_000)

    const second = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })
    expect(second.statusCode).toBe(200)
    expect(second.json().data.aum).toBe(12345.6789)
  })

  it('replaces a newer cached error with an older successful scan', async () => {
    const cache = testAdapter.mockCache
    if (!cache) {
      throw new Error('mock cache was not initialized')
    }
    const param = { portfolioNo: PORTFOLIO_NO, isin: ISIN }
    const key = porTransport.responseCache.getCacheKey(porTransport.name, param)
    await cache.set(
      key,
      {
        statusCode: 502,
        errorMessage: 'cached failure',
        timestamps: {
          providerDataRequestedUnixMs: Date.now() + 1_000,
          providerDataReceivedUnixMs: Date.now() + 1_000,
          providerIndicatedTimeUnixMs: undefined,
        },
      },
      60_000,
    )
    mockPositions(0, page({ positions: [position(ISIN, 12345.6789)] }))

    const context = {
      endpointName: 'por',
      inputParameters,
      adapterSettings: porTransport.settings,
    } as unknown as EndpointContext<BaseEndpointTypes>
    await porTransport.handleRequest(param, context)

    const cached = (await cache.get(key)) as { statusCode: number; result: number } | undefined
    expect(cached?.statusCode).toBe(200)
    expect(cached?.result).toBe(12345.6789)
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

  it('refreshes a 401 on a later page without restarting pagination', async () => {
    mockPositions(
      0,
      page({ positions: [position(ISIN, 5.5)], totalPages: 2, number: 0, last: false }),
    )
    mockPositionsError(1, 401)
    const refresh = mockRefresh(REFRESHED_ACCESS_TOKEN)
    mockPositions(
      1,
      page({ positions: [position('OTHER', 1)], totalPages: 2, number: 1 }),
      REFRESHED_ACCESS_TOKEN,
    )

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.aum).toBe(5.5)
    expect(refresh.isDone()).toBe(true)
  })

  it('returns 502 after a single refresh when the retried page is rejected again', async () => {
    mockPositionsError(0, 401)
    const refresh = mockRefresh(REFRESHED_ACCESS_TOKEN)
    mockPositionsError(0, 401, {}, REFRESHED_ACCESS_TOKEN)

    const response = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })

    expect(response.statusCode).toBe(502)
    // A second refresh or login fallback would have no mock and surface as a
    // connection failure instead.
    expect(response.json().errorMessage).toBe('AMINA request failed (401)')
    expect(refresh.isDone()).toBe(true)
  })

  it('serves a second request from the cache without calling the provider again', async () => {
    let positionsCalls = 0
    mockPositions(
      0,
      page({ positions: [position(ISIN, 12345.6789)] }),
      ACCESS_TOKEN,
      () => (positionsCalls += 1),
    ).persist()

    const first = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })
    const second = await testAdapter.request({
      endpoint: 'por',
      portfolioNo: PORTFOLIO_NO,
      isin: ISIN,
    })
    // Let the background executor run again so a missing cache check would
    // hit the persisted provider mock.
    await sleep(50)

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(200)
    expect(second.json()).toEqual(first.json())
    expect(positionsCalls).toBe(1)
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
