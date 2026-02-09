import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/multi-http'
import { HttpTransportTypes, MultiHttpTransport } from '../../src/transport/multi-http'

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

describe('MultiHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'multi-http'

  const apiUrl = 'http://test.api.url'
  const authHeader = 'Authorization'
  const apiKey = 'Bearer test-token'

  const apiName = 'TEST'

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

  let transport: MultiHttpTransport

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

    transport = new MultiHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should extract multiple data paths from response', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0043732667449965,
          asset_under_management: 30127047.47,
          ripcord: false,
        },
        cost: undefined,
      },
      timestamps: {},
    }

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
        nav: 1.0043732667449965,
        aum: 30127047.47,
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: null,
      timestamps: {
        providerIndicatedTimeUnixMs: undefined,
      },
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

  it('should convert providerIndicatedTimePath ISO string to providerIndicatedTimeUnixMs', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0043732667449965,
          updatedAt: '2026-01-19T06:56:22.194Z',
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      data: {
        nav: 1.0043732667449965,
      },
      result: null,
      timestamps: {
        providerIndicatedTimeUnixMs: 1768805782194,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should convert providerIndicatedTimePath Unix ms number to providerIndicatedTimeUnixMs', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0043732667449965,
          updatedAt: 1768805782194,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      data: {
        nav: 1.0043732667449965,
      },
      result: null,
      timestamps: {
        providerIndicatedTimeUnixMs: 1768805782194,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should return an error if providerIndicatedTimePath is not found', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'non_existent_timestamp',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      errorMessage:
        "Provider indicated time path 'non_existent_timestamp' not found in response for 'TEST'",
      statusCode: 500,
      timestamps: {},
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should return an error if providerIndicatedTimePath value is invalid', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
          updatedAt: 'garbage',
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      errorMessage: "Invalid timestamp value at 'updatedAt' for 'TEST'",
      statusCode: 500,
      timestamps: {},
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should return an error if data path is not found', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'missing', path: 'non_existent_field' },
      ],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      errorMessage: "Data path 'non_existent_field' not found in response for 'TEST'",
      statusCode: 500,
      timestamps: {},
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should return an error if ripcord is activated', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      errorMessage: "Ripcord activated for 'TEST'",
      ripcord: true,
      ripcordAsInt: 1,
      ripcordDetails: undefined,
      statusCode: 503,
      timestamps: {},
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should return an error if response data is empty', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: null,
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedResponse = {
      errorMessage: "The data provider for TEST didn't return any value",
      statusCode: 502,
      timestamps: {
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
  })

  it('should throw if API_URL is missing', async () => {
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    await expect(() => transport.backgroundExecute(context)).rejects.toThrow(
      "Missing required environment variable 'TEST_API_URL'.",
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
  })

  it('should work without auth headers', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      baseURL: apiUrl,
    }
    const expectedRequestKey = requestKeyForParams(params)

    expect(requester.request).toHaveBeenCalledWith(
      expectedRequestKey,
      expectedRequestConfig,
      undefined,
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: { nav: 1.0 },
          result: null,
          timestamps: { providerIndicatedTimeUnixMs: undefined },
        },
      },
    ])
  })

  it('should handle nested data paths', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'value', path: 'data.nested.value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          data: {
            nested: {
              value: 42,
            },
          },
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: { value: 42 },
          result: null,
          timestamps: { providerIndicatedTimeUnixMs: undefined },
        },
      },
    ])
  })

  it('should extract result field as primary result (view-function-multi-chain pattern)', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [
        { name: 'result', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.004373,
          asset_under_management: 30127047.47,
          ripcord: false,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: {
            result: 1.004373,
            aum: 30127047.47,
            ripcord: false,
            ripcordAsInt: 0,
          },
          result: 1.004373,
          timestamps: { providerIndicatedTimeUnixMs: undefined },
        },
      },
    ])
  })

  it('should include ripcordDetails in error message when ripcord is activated (the-network-firm pattern)', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
          ripcordDetails: ['Price deviation too high', 'Stale data detected'],
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          errorMessage:
            "Ripcord activated for 'TEST'. Details: Price deviation too high, Stale data detected",
          ripcord: true,
          ripcordAsInt: 1,
          ripcordDetails: 'Price deviation too high, Stale data detected',
          statusCode: 503,
          timestamps: {},
        },
      },
    ])
  })

  it('should handle empty ripcordDetails array', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
          ripcord: true,
          ripcordDetails: [],
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          errorMessage: "Ripcord activated for 'TEST'",
          ripcord: true,
          ripcordAsInt: 1,
          ripcordDetails: undefined,
          statusCode: 503,
          timestamps: {},
        },
      },
    ])
  })

  it('should include ripcord status in data when ripcord is false', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.004373,
          ripcord: false,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: {
            result: 1.004373,
            ripcord: false,
            ripcordAsInt: 0,
          },
          result: 1.004373,
          timestamps: { providerIndicatedTimeUnixMs: undefined },
        },
      },
    ])
  })

  it('should return null result when result field not in dataPaths (backward compatible)', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          net_asset_value: 1.004373,
          asset_under_management: 30127047.47,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: {
            nav: 1.004373,
            aum: 30127047.47,
          },
          result: null,
          timestamps: { providerIndicatedTimeUnixMs: undefined },
        },
      },
    ])
  })

  it('should handle full OpenDelta NX8 scenario', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [
        { name: 'result', path: 'net_asset_value' },
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = {
      response: {
        data: {
          client: 'opendeltanx8',
          net_asset_value: 1.004373266744996434,
          asset_under_management: 30127047.47,
          outstanding_shares: 29995867.54,
          min_rate: 0.99,
          max_rate: 1.01,
          updatedAt: '2026-01-19T06:56:22.194Z',
          ripcord: false,
          ripcordDetails: [],
        },
        cost: undefined,
      },
      timestamps: {},
    }

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          data: {
            result: 1.004373266744996434,
            nav: 1.004373266744996434,
            aum: 30127047.47,
            ripcord: false,
            ripcordAsInt: 0,
          },
          result: 1.004373266744996434,
          timestamps: {
            providerIndicatedTimeUnixMs: 1768805782194,
          },
        },
      },
    ])
  })
})
