import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/forex'
import { ForexHttpTransport, HttpTransportTypes } from '../../src/transport/forex'

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

describe('ForexHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'forex'
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

  let transport: ForexHttpTransport

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

    transport = new ForexHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should request the latest rate and return it', async () => {
    const params = makeStub('params', {
      base: 'eur',
      quote: 'usd',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      base: 'EUR',
      quote: 'USD',
      data: [{ date: '2026-06-18', val: 1.1712, observation_datetime: 1781740800 }],
    })

    await transport.backgroundExecute(context)

    expect(requester.request).toHaveBeenCalledWith(
      requestKeyForParams(params),
      {
        baseURL: apiUrl,
        url: '/forex/EUR/USD',
        headers: {
          'X-API-Key': apiKey,
        },
        params: {
          limit: 1,
        },
      },
      undefined,
    )
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: 1.1712,
          data: {
            result: 1.1712,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: 1781740800000,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should use the most recent row and fall back to its date', async () => {
    const params = makeStub('params', {
      base: 'EUR',
      quote: 'USD',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      base: 'EUR',
      quote: 'USD',
      data: [
        { date: '2026-06-17', val: 1.17, observation_datetime: null },
        { date: '2026-06-18', val: 1.1712, observation_datetime: null },
        { date: '2026-06-19', val: null, observation_datetime: null },
      ],
    })

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: 1.1712,
          data: {
            result: 1.1712,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: Date.UTC(2026, 5, 18),
          },
        },
      },
    ])
  })

  it('should return an error when no rate is returned', async () => {
    const params = makeStub('params', {
      base: 'EUR',
      quote: 'USD',
    })
    subscriptionSet.getAll.mockReturnValue([params])
    mockProviderResponse({
      base: 'EUR',
      quote: 'USD',
      data: [{ date: '2026-06-18', val: null, observation_datetime: null }],
    })

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          errorMessage: 'FXMacroData returned no rate for EUR/USD',
          statusCode: 502,
          timestamps: {},
        },
      },
    ])
  })
})
