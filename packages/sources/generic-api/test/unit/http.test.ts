import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/http'
import { GenericApiHttpTransport, HttpTransportTypes } from '../../src/transport/http'

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

describe('GenericApiHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'http'

  const apiUrl = 'http://test.api.url'
  const authHeader = 'X-API-Key'
  const apiKey = 'test-api-key'

  const apiName = 'test'
  const dataPath = 'data.value'
  const ripcordPath = 'data.ripcord'

  const expectedValue = '42'

  const adapterSettings = makeStub('adapterSettings', {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
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

  let transport: GenericApiHttpTransport

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
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new GenericApiHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should make the request', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      baseURL: apiUrl,
      headers: {
        [authHeader]: apiKey,
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        result: expectedValue,
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

  it('should throw if API_URL is missing', async () => {
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await expect(() => transport.backgroundExecute(context)).rejects.toThrow(
      "Missing required environment variable 'TEST_API_URL'.",
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
  })

  it('should throw if AUTH_HEADER is missing', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await expect(() => transport.backgroundExecute(context)).rejects.toThrow(
      'If one of TEST_AUTH_HEADER or TEST_AUTH_HEADER_VALUE is set, both must be set.',
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
  })

  it('should throw if AUTH_HEADER_VALUE is missing', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await expect(() => transport.backgroundExecute(context)).rejects.toThrow(
      'If one of TEST_AUTH_HEADER or TEST_AUTH_HEADER_VALUE is set, both must be set.',
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
  })

  it('should not throw if both AUTH_HEADER and AUTH_HEADER_VALUE are missing', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      baseURL: apiUrl,
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        result: expectedValue,
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
  it('should return an error if data path is invalid', async () => {
    const dataPath = 'something.invalid'

    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      baseURL: apiUrl,
      headers: {
        [authHeader]: apiKey,
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      errorMessage: "Data path 'something.invalid' not found in response for 'test'",
      statusCode: 500,

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

  it('should return an error if ripcord is active', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = makeStub('params', {
      apiName,
      dataPath,
      ripcordPath,
      ripcordDisabledValue: 'false',
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          data: {
            value: expectedValue,
            ripcord: true,
          },
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      baseURL: apiUrl,
      headers: {
        [authHeader]: apiKey,
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      errorMessage: "Ripcord activated for 'test'",
      statusCode: 503,

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
