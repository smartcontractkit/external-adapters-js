import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/cpi'
import { CpiTransport, HttpTransportTypes } from '../../src/transport/cpi'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)
metrics.initialize()

describe('CpiTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'cpi'
  const apiKey = 'test-api-key'
  const apiUrl = 'http://truflation.invalid/cpi'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: apiUrl,
    API_KEY: apiKey,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
    DEFAULT_CACHE_KEY: 'default-cache-key',
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

  let transport: CpiTransport

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
    restoreEnv()
    jest.restoreAllMocks()
    jest.useFakeTimers()

    transport = new CpiTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should make the request', async () => {
    process.env.API_URL = apiUrl
    process.env.API_KEY = apiKey
    const startDate = '2011-11-11'
    const expectedValue = 123.45

    const params = makeStub('params', {})
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          index: [startDate],
          truflation_us_cpi_frozen_index: [expectedValue],
          start_date: startDate,
          cost: {},
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      headers: {
        Authorization: adapterSettings.API_KEY,
      },
      baseURL: adapterSettings.API_ENDPOINT,
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        date: startDate,
        cpi: expectedValue,
      },
      result: expectedValue,
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
  })
})
