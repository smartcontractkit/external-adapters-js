import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

import { BaseEndpointTypes, inputParameters as navInputParams } from '../../src/endpoint/nav'
import { NavTransport } from '../../src/transport/nav'

LoggerFactoryProvider.set()

const FUND_ID = 123
const TIMEZONE = 'UTC'
const transportName = 'nav_transport'
const endpointName = 'nav'

let transport: NavTransport

// adapter settings stub
const adapterSettings = makeStub('adapterSettings', {
  API_ENDPOINT: 'https://api.navfund.com',
  BACKGROUND_EXECUTE_MS: 0,
  WARMUP_SUBSCRIPTION_TTL: 10_000,
} as unknown as BaseEndpointTypes['Settings'])

process.env.API_KEY_123 = 'apiKey'
process.env.SECRET_KEY_123 = 'secret'

// requester stub that we'll control per‑test
const requester = makeStub('requester', { request: jest.fn() })
const responseCache = makeStub('responseCache', { write: jest.fn() })
const dependencies = makeStub('dependencies', {
  requester,
  responseCache,
  subscriptionSetFactory: { buildSet: jest.fn() },
} as unknown as TransportDependencies<any>)

// helper to pull the cached response written in handleRequest
const getCachedResponse = () => (responseCache.write.mock.calls[0][1] as any)[0].response

const FUND_DATES_RES = makeStub('fundDatesRes', {
  response: {
    data: { LogID: 1, FromDate: '06-01-2025', ToDate: '07-01-2025' },
  },
})

const fundListRow = (globalFundID: number, officialAccountingLastAvailableDate: string) => ({
  FundName: `Fund ${globalFundID}`,
  GlobalFundID: globalFundID,
  FundEndDate: '2030-12-31T00:00:00',
  FundDailyAccountingStartDate: '2020-01-01T00:00:00',
  FundDailyAccountingLastAvailableDate: null,
  FundOfficialAccountingLastAvailableDate: officialAccountingLastAvailableDate,
  PortfolioLastAvailableDate: officialAccountingLastAvailableDate,
})

const fundListRes = (rows: ReturnType<typeof fundListRow>[]) =>
  makeStub('fundListRes', { response: { data: rows } })

// The last available date is after the fund ToDate, so the ToDate wins by default
const FUND_LIST_RES = fundListRes([
  fundListRow(999, '2025-06-15T00:00:00'),
  fundListRow(FUND_ID, '2025-07-10T00:00:00'),
])

const FUND_ROWS = [
  {
    'NAV Per Share': 50,
    'Next NAV Price': 51,
    'Ending Balance': 52,
    'Accounting Date': '06-10-2025',
  },
  {
    'NAV Per Share': 150,
    'Next NAV Price': 151,
    'Ending Balance': 152,
    'Accounting Date': '06-25-2025',
  },
]

const FUND_RES = makeStub('fundRes', {
  response: {
    data: { Data: FUND_ROWS },
  },
})

describe('NavTransport – handleRequest', () => {
  beforeEach(async () => {
    transport = new NavTransport() as unknown as InstanceType<typeof NavTransport>
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
    jest.resetAllMocks()
  })

  it('returns latest NAV and writes all result fields to cache', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(FUND_LIST_RES)
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    expect(responseCache.write).toHaveBeenCalledTimes(1)

    const params = {
      globalFundID: 123,
      navDateTimestampTimezone: 'UTC',
      resultField: 'navPerShare',
    }
    const response = {
      statusCode: 200,
      result: 150,
      data: {
        globalFundID: FUND_ID,
        navPerShare: 150,
        nextNavPerShare: 151,
        navDate: '06-25-2025',
        endingBalance: 152,
        navDateTimestampMs: 1750809600000,
      },
      timestamps: expect.objectContaining({
        providerDataRequestedUnixMs: expect.any(Number),
        providerDataReceivedUnixMs: expect.any(Number),
        providerIndicatedTimeUnixMs: expect.any(Number),
      }),
    }

    const cached = responseCache.write.mock.calls[0][1]
    expect(cached).toEqual([
      {
        params,
        response,
      },
      {
        params: {
          ...params,
          resultField: 'nextNavPerShare',
        },
        response: {
          ...response,
          result: response.data.nextNavPerShare,
        },
      },
      {
        params: {
          ...params,
          resultField: 'endingBalance',
        },
        response: {
          ...response,
          result: response.data.endingBalance,
        },
      },
      {
        params: {
          ...params,
          resultField: 'navDateTimestampMs',
        },
        response: {
          ...response,
          result: response.data.navDateTimestampMs,
        },
      },
    ])
    expect(requester.request).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        url: expect.stringContaining('/GetAccountingDataDates'),
      }),
    )

    expect(requester.request).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        url: expect.stringContaining('/GetFundList'),
      }),
    )

    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        url: expect.stringContaining('/GetOfficialNAVAndPerformanceReturnsForFund'),
      }),
    )
  })

  it('maps downstream AdapterError to 502 response', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES) // first OK
    requester.request.mockResolvedValueOnce(FUND_LIST_RES) // second OK
    requester.request.mockRejectedValueOnce(new AdapterError({ message: 'boom' }))

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

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
    requester.request.mockResolvedValueOnce(FUND_LIST_RES)

    const fundRows = [
      {
        'NAV Per Share': 42,
        'Next NAV Price': 142,
        'Ending Balance': 242,
        'Accounting Date': '06-30-2025',
      },
      {
        'NAV Per Share': 43,
        'Next NAV Price': 143,
        'Ending Balance': 243,
        'Accounting Date': '07-01-2025',
      },
    ]
    const fundRes = makeStub('fundRes', { response: { data: { Data: fundRows } } })
    requester.request.mockResolvedValueOnce(fundRes)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        url: expect.stringContaining('fromDate=06-28-2025'),
      }),
    )
  })

  it('queries up to the fund ToDate when it is before the last available date', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES) // ToDate 07-01-2025
    requester.request.mockResolvedValueOnce(
      fundListRes([fundListRow(FUND_ID, '2025-07-10T00:00:00')]),
    )
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        // 7 business days before 07-01-2025 (Tue) is 06-20-2025 (Fri)
        url: expect.stringContaining('fromDate=06-20-2025&toDate=07-01-2025'),
      }),
    )
  })

  it('does not query past FundOfficialAccountingLastAvailableDate', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES) // ToDate 07-01-2025
    requester.request.mockResolvedValueOnce(
      fundListRes([
        fundListRow(999, '2025-07-10T00:00:00'),
        fundListRow(FUND_ID, '2025-06-25T00:00:00'),
      ]),
    )
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        // 7 business days before 06-25-2025 (Wed) is 06-16-2025 (Mon)
        url: expect.stringContaining('fromDate=06-16-2025&toDate=06-25-2025'),
      }),
    )
  })

  it('ignores the time of day on FundOfficialAccountingLastAvailableDate', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES) // ToDate 07-01-2025
    requester.request.mockResolvedValueOnce(
      fundListRes([fundListRow(FUND_ID, '2025-06-25T23:59:59')]),
    )
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    expect(requester.request).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.objectContaining({
        url: expect.stringContaining('toDate=06-25-2025'),
      }),
    )
  })

  it('caches 400 when the fund is missing from the fund list', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(fundListRes([fundListRow(999, '2025-07-10T00:00:00')]))

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    const cached = getCachedResponse()
    expect(cached.statusCode).toBe(400)
    expect(cached.errorMessage).toBe(`Fund with GlobalFundID ${FUND_ID} not found in fund list`)
    // The fund endpoint is never queried
    expect(requester.request).toHaveBeenCalledTimes(2)
  })

  it('caches 400 when the fund list is empty', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(
      makeStub('emptyFundList', { response: { data: undefined } }),
    )

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    const cached = getCachedResponse()
    expect(cached.statusCode).toBe(400)
    expect(cached.errorMessage).toMatch(/No fund list found/i)
  })

  it('caches 400 when Fund rows are empty', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(FUND_LIST_RES)
    requester.request.mockResolvedValueOnce(
      makeStub('emptyFund', { response: { data: { Data: [] } } }),
    )
    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: TIMEZONE,
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    const cached = getCachedResponse()
    expect(cached.statusCode).toBe(400)
    expect(cached.errorMessage).toMatch(/No fund found/i)
  })

  it('returns midnight in the given timezone for navDateTimestampMs', async () => {
    requester.request.mockResolvedValueOnce(FUND_DATES_RES)
    requester.request.mockResolvedValueOnce(FUND_LIST_RES)
    requester.request.mockResolvedValueOnce(FUND_RES)

    const param = makeStub('param', {
      globalFundID: FUND_ID,
      navDateTimestampTimezone: 'America/Los_Angeles',
    } as typeof navInputParams.validated)

    await transport.handleRequest(param)

    const cached = getCachedResponse()
    // June 25, 2025 midnight PT (UTC-7) = 7AM UTC
    expect(cached.data.navDateTimestampMs).toBe(Date.UTC(2025, 5, 25, 7, 0, 0, 0))
    expect(cached.timestamps.providerIndicatedTimeUnixMs).toBe(1750809600000)
  })
})
