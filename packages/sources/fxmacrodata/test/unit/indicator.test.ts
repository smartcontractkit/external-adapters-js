import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/indicator'
import { HttpTransportTypes, IndicatorHttpTransport } from '../../src/transport/indicator'

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

describe('IndicatorHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'indicator'
  const apiKey = 'test-api-key'
  const apiUrl = 'https://api.example.com/v1'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: apiUrl,
    API_KEY: apiKey,
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

  const context = makeStub('context', {
    adapterSettings,
    endpointName,
  } as EndpointContext<HttpTransportTypes>)

  let transport: IndicatorHttpTransport

  const requestKeyForParams = (params: typeof inputParameters.validated) => {
    return calculateHttpRequestKey<HttpTransportTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: [params],
      transportName,
    })
  }

  const mockProviderResponse = (data: object) => {
    requester.request.mockResolvedValue(
      makeStub('response', {
        response: {
          data: {
            ...data,
            cost: undefined,
          },
        },
        timestamps: {},
      }),
    )
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new IndicatorHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should request the latest release and return it', async () => {
    const params = makeStub('params', {
      currency: 'usd',
      indicator: 'Inflation',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      currency: 'USD',
      indicator: 'inflation',
      data: [{ date: '2026-02-28', val: 3.0, announcement_datetime: 1772433000 }],
    })

    await transport.backgroundExecute(context)

    expect(requester.request).toHaveBeenCalledWith(
      requestKeyForParams(params),
      {
        baseURL: apiUrl,
        url: '/announcements/USD/inflation',
        headers: {
          'X-API-Key': apiKey,
        },
        params: {
          limit: 1,
        },
        maxRedirects: 0,
      },
      undefined,
    )
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: 3.0,
          data: {
            result: 3.0,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: 1772433000000,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should use the most recent row and omit a missing release time', async () => {
    const params = makeStub('params', {
      currency: 'USD',
      indicator: 'policy_rate',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      currency: 'USD',
      indicator: 'policy_rate',
      data: [
        { date: '2026-07-29', val: 4.25, announcement_datetime: 1785348000 },
        { date: '2026-09-16', val: 4.0, announcement_datetime: null },
      ],
    })

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: 4.0,
          data: {
            result: 4.0,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      },
    ])
  })

  it('should return an error when no value is returned', async () => {
    const params = makeStub('params', {
      currency: 'USD',
      indicator: 'gdp',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      currency: 'USD',
      indicator: 'gdp',
      data: [],
    })

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          errorMessage: 'FXMacroData returned no value for USD gdp',
          statusCode: 502,
          timestamps: {},
        },
      },
    ])
  })

  it('should return an error for an error body or unexpected shape', async () => {
    const params = makeStub('params', {
      currency: 'USD',
      indicator: 'gdp',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    for (const body of [{ detail: 'Invalid API key' }, { data: { date: '2026-06-18', val: 1.1 } }]) {
      responseCache.write.mockClear()
      mockProviderResponse(body)

      await transport.backgroundExecute(context)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: {
            errorMessage: 'FXMacroData returned no value for USD gdp',
            statusCode: 502,
            timestamps: {},
          },
        },
      ])
    }
  })
})
