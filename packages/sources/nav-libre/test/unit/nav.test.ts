import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes, inputParameters as navInputParams } from '../../src/endpoint/nav'
import { NavLibreTransport } from '../../src/transport/nav'

LoggerFactoryProvider.set()

const FUND_ID = 123
const transportName = 'nav_transport'
const endpointName = 'nav'

let transport: NavLibreTransport

// adapter settings stub
const adapterSettings = makeStub('adapterSettings', {
  API_ENDPOINT: 'https://api.navfund.com',
  API_KEY: 'apiKey',
  SECRET_KEY: 'secret',
  BACKGROUND_EXECUTE_MS: 0,
  MAX_RETRIES: 3,
  WARMUP_SUBSCRIPTION_TTL: 10_000,
} as unknown as BaseEndpointTypes['Settings'])

// requester stub that we'll control per‑test
const requester = makeStub('requester', { request: jest.fn() })
const responseCache = makeStub('responseCache', { write: jest.fn() })
const dependencies = makeStub('dependencies', {
  requester,
  responseCache,
  subscriptionSetFactory: { buildSet: jest.fn() },
} as unknown as TransportDependencies<any>)

beforeEach(async () => {
  transport = new NavLibreTransport() as unknown as InstanceType<typeof NavLibreTransport>
  await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  jest.resetAllMocks()
})

// helper to pull the cached response written in handleRequest
const getCachedResponse = () => (responseCache.write.mock.calls[0][1] as any)[0].response

const FUND_DATES_RES = makeStub('fundDatesRes', {
  response: {
    data: { LogID: 1, FromDate: '06-01-2025', ToDate: '07-01-2025' },
  },
})

const FUND_ROWS = [
  { 'NAV Per Share': 50, 'Accounting Date': '06-10-2025' },
  { 'NAV Per Share': 150, 'Accounting Date': '06-25-2025' },
]

const FUND_RES = makeStub('fundRes', {
  response: {
    data: { Data: FUND_ROWS },
  },
})

describe('NavLibreTransport – handleRequest', () => {
  it('returns latest NAV and writes to cache', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', { globalFundID: FUND_ID } as typeof navInputParams.validated)

    await transport.handleRequest({ adapterSettings } as any, param)

    expect(responseCache.write).toHaveBeenCalledTimes(1)

    const cached = getCachedResponse()
    expect(cached).toEqual({
      statusCode: 200,
      result: 150,
      data: {
        globalFundID: FUND_ID,
        navPerShare: 150,
        navDate: '06-25-2025',
      },
      timestamps: expect.objectContaining({
        providerDataRequestedUnixMs: expect.any(Number),
        providerDataReceivedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      }),
    })

    expect(requester.request).toHaveBeenCalledTimes(2)
    const fundDatesCall = requester.request.mock.calls[0]
    expect(fundDatesCall[1]).toMatchObject({
      url: expect.stringContaining('/GetAccountingDataDates'),
    })

    const fundCall = requester.request.mock.calls[1]
    expect(fundCall[1]).toMatchObject({
      url: expect.stringContaining('/GetOfficialNAVAndPerformanceReturnsForFund'),
    })
  })

  it('maps downstream AdapterError to 502 response', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES) // first OK
    requester.request.mockRejectedValueOnce(new AdapterError({ message: 'boom' }))

    const param = makeStub('param', { globalFundID: FUND_ID } as typeof navInputParams.validated)

    await transport.handleRequest({ adapterSettings } as any, param)

    expect(responseCache.write).toHaveBeenCalledTimes(1)
    const cached = getCachedResponse()
    expect(cached.statusCode).toBe(500)
    expect(cached.errorMessage).toContain('boom')
  })

  it('uses provider earliestFrom when span <= 7 business days', async () => {
    const shortSpanDates = makeStub('dates', {
      response: { data: { LogID: 1, FromDate: '06-28-2025', ToDate: '07-01-2025' } },
    })
    requester.request.mockResolvedValueOnce(shortSpanDates)

    const fundRows = [
      { 'NAV Per Share': 42, 'Accounting Date': '06-30-2025' },
      { 'NAV Per Share': 43, 'Accounting Date': '07-01-2025' },
    ]
    const fundRes = makeStub('fundRes', { response: { data: { Data: fundRows } } })
    requester.request.mockResolvedValueOnce(fundRes)

    const param = makeStub('param', { globalFundID: FUND_ID } as typeof navInputParams.validated)

    await transport.handleRequest({ adapterSettings } as any, param)

    const fundCallCfg = requester.request.mock.calls[1][1]
    expect(fundCallCfg.url).toContain('fromDate=06-28-2025')
  })

  it('caches 400 when Fund rows are empty', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(
      makeStub('emptyFund', { response: { data: { Data: [] } } }),
    )
    const param = makeStub('param', { globalFundID: FUND_ID } as typeof navInputParams.validated)

    await transport.handleRequest({ adapterSettings } as any, param)

    const cached = getCachedResponse()
    expect(cached.statusCode).toBe(400)
    expect(cached.errorMessage).toMatch(/No fund found/i)
  })
})
