import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/market-status'
import { HttpTransportTypes, MarketStatusHttpTransport } from '../../src/transport/market-status'

const log = jest.fn()
const debugLog = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: debugLog,
  trace: debugLog,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)
metrics.initialize()

const marketStatusGraphqlQuery = `
  query MarketBase($ids: [UserInputId!]!) {
    markets(scheme: BC, ids: $ids) {
      referenceData {
        marketBase {
          bc
          tradingDays
          marketTimeZone
          marketOpenTime
          marketCloseTime
        }
        marketHolidays {
          date
          extraordinaryTradingDay
          extraordinaryOpeningTime
          extraordinaryClosingTime
        }
      }
    }
  }`.replace(/\s+/g, ' ')

const marketStatusResponse = {
  data: {
    markets: [
      {
        referenceData: {
          marketBase: {
            bc: 1058,
            tradingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            marketOpenTime: '08:30:00',
            marketCloseTime: '17:45:00',
            marketTimeZone: 'Europe/Madrid',
          },
          marketHolidays: [
            {
              date: '2026-01-01',
              extraordinaryTradingDay: false,
              extraordinaryOpeningTime: null,
              extraordinaryClosingTime: null,
            },
            {
              date: '2026-04-03',
              extraordinaryTradingDay: false,
              extraordinaryOpeningTime: null,
              extraordinaryClosingTime: null,
            },
            {
              date: '2026-04-06',
              extraordinaryTradingDay: false,
              extraordinaryOpeningTime: null,
              extraordinaryClosingTime: null,
            },
            {
              date: '2026-05-01',
              extraordinaryTradingDay: false,
              extraordinaryOpeningTime: null,
              extraordinaryClosingTime: null,
            },
            {
              date: '2026-12-24',
              extraordinaryTradingDay: true,
              extraordinaryOpeningTime: '09:00:00',
              extraordinaryClosingTime: '13:55:00',
            },
            {
              date: '2026-12-25',
              extraordinaryTradingDay: false,
              extraordinaryOpeningTime: null,
              extraordinaryClosingTime: null,
            },
            {
              date: '2026-12-31',
              extraordinaryTradingDay: true,
              extraordinaryOpeningTime: '09:00:00',
              extraordinaryClosingTime: '13:55:00',
            },
          ],
        },
      },
    ],
  },
}

describe('MarketStatusHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'market-status'
  const publicCert = 'test-public-cert'
  const privateKey = 'test-private-key'
  const apiUrl = 'http://api.example.com'

  const bmeId = '1058'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: apiUrl,
    PUBLIC_CERT: publicCert,
    PRIVATE_KEY: privateKey,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
  } as unknown as HttpTransportTypes['Settings'])

  const subscriptionSet = makeStub('subscriptionSet', {
    getAll: jest.fn(),
  })

  const subscriptionSetFactory = makeStub('subscriptionSetFactory', {
    buildSet() {
      return subscriptionSet
    },
  })

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  const responseCache = {
    write: jest.fn(),
  }
  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<HttpTransportTypes>)

  let transport: MarketStatusHttpTransport

  const requestKeyForParams = (params: typeof inputParameters.validated) => {
    const requestKey = calculateHttpRequestKey<HttpTransportTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: [params],
      transportName,
    })
    return requestKey
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new MarketStatusHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  const doMarketStatusTest = async (
    currentTime: Date,
    expectedResponseData: { result: number; statusString: string },
  ) => {
    jest.setSystemTime(currentTime)
    const params = makeStub('params', {
      market: bmeId,
      type: 'regular',
      force245MarketStatus: false,
    } as const)
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          ...marketStatusResponse,
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      method: 'POST',
      baseURL: adapterSettings.API_ENDPOINT,
      url: '/web/v2/graphql',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: {
        query: marketStatusGraphqlQuery,
        variables: {
          ids: [params.market],
        },
      },
      httpsAgent: expect.anything(),
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      result: expectedResponseData.result,
      data: expectedResponseData,
      timestamps: {},
    }

    expect(requester.request).toHaveBeenCalledWith(
      expectedRequestKey,
      expectedRequestConfig,
      undefined,
    )
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  }

  it('should open the market Monday morning', async () => {
    await doMarketStatusTest(new Date('2026-01-05T08:29:59+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-01-05T08:30:01+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
  })

  it('should close the market Monday afternoon', async () => {
    await doMarketStatusTest(new Date('2026-01-05T17:44:59+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-01-05T17:45:01+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should open the market Friday morning', async () => {
    await doMarketStatusTest(new Date('2026-01-09T08:29:59+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-01-09T08:30:01+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
  })

  it('should close the market Friday afternoon', async () => {
    await doMarketStatusTest(new Date('2026-01-09T17:44:59+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-01-09T17:45:01+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should be closed on Saturday', async () => {
    await doMarketStatusTest(new Date('2026-01-10T10:45:00+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should be closed on Sunday', async () => {
    await doMarketStatusTest(new Date('2026-01-11T10:45:00+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should open the market in the morning in summer time', async () => {
    await doMarketStatusTest(new Date('2026-07-08T08:29:59+02:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-07-08T08:30:01+02:00'), {
      result: 2,
      statusString: 'OPEN',
    })
  })

  it('should close the market in the evening in summer time', async () => {
    await doMarketStatusTest(new Date('2026-07-08T17:44:59+02:00'), {
      result: 2,
      statusString: 'OPEN',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-07-08T17:45:01+02:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should open the market late on Christmas eve', async () => {
    await doMarketStatusTest(new Date('2026-12-24T08:59:59+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-12-24T09:00:01+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
  })

  it('should close the market early on Christmas eve', async () => {
    await doMarketStatusTest(new Date('2026-12-24T13:54:50+01:00'), {
      result: 2,
      statusString: 'OPEN',
    })
    jest.resetAllMocks()
    await doMarketStatusTest(new Date('2026-12-24T13:55:01+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  it('should be closed on Christmas', async () => {
    await doMarketStatusTest(new Date('2026-12-25T10:45:00+01:00'), {
      result: 1,
      statusString: 'CLOSED',
    })
  })

  const doMarketStatusErrorTest = async (
    responseData: object,
    expectedErrorResponse: { errorMessage: string; statusCode: number },
  ) => {
    // A trading day (Monday) during market hours, so that the invalid time format
    // test reaches the time parsing. The other error cases fail before any time logic.
    jest.setSystemTime(new Date('2026-01-05T10:45:00+01:00'))
    const params = makeStub('params', {
      market: bmeId,
      type: 'regular',
      force245MarketStatus: false,
    } as const)
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          ...responseData,
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      ...expectedErrorResponse,
      timestamps: {},
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  }

  it('should return an error when the provider returns no markets', async () => {
    await doMarketStatusErrorTest(
      { data: { markets: undefined } },
      {
        errorMessage: `The data provider didn't return any value for ${bmeId}`,
        statusCode: 502,
      },
    )
  })

  it('should return an error when the requested market is not in the response', async () => {
    const otherMarketResponse = {
      data: {
        markets: [
          {
            referenceData: {
              marketBase: {
                bc: 9999,
                tradingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                marketOpenTime: '08:30:00',
                marketCloseTime: '17:45:00',
                marketTimeZone: 'Europe/Madrid',
              },
              marketHolidays: [],
            },
          },
        ],
      },
    }
    await doMarketStatusErrorTest(otherMarketResponse, {
      errorMessage: `Market '${bmeId}' not found in response. Found: 9999`,
      statusCode: 502,
    })
  })

  it('should return an error when the market has an invalid time format', async () => {
    const invalidTimeResponse = {
      data: {
        markets: [
          {
            referenceData: {
              marketBase: {
                bc: 1058,
                tradingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                marketOpenTime: 'not-a-time',
                marketCloseTime: '17:45:00',
                marketTimeZone: 'Europe/Madrid',
              },
              marketHolidays: [],
            },
          },
        ],
      },
    }
    await doMarketStatusErrorTest(invalidTimeResponse, {
      errorMessage: `Invalid time format: 'not-a-time', expected 'HH:mm:ss'`,
      statusCode: 502,
    })
  })
})
