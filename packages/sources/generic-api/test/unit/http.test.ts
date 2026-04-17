import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  LoggerFactoryProvider,
  PartialAdapterResponse,
} from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters, RequestParams } from '../../src/endpoint/http'
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

  const doTransportTest = async ({
    params,
    expectedRequestConfig,
    response,
    expectedResponse,
  }: {
    params: RequestParams
    expectedRequestConfig: {
      baseURL: string
      headers?: Record<string, string>
    }
    response: {
      response: { data: object | null }
      timestamps: {
        providerIndicatedTimeUnixMs?: number
      }
    }
    expectedResponse: PartialAdapterResponse<BaseEndpointTypes['Response']> & {
      statusCode?: number
    }
  }) => {
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestKey = requestKeyForParams(params)

    expect(requester.request).toHaveBeenCalledWith(
      expectedRequestKey,
      expectedRequestConfig,
      undefined,
    )
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          ...expectedResponse,
          statusCode: expectedResponse.statusCode ?? 200,
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  }

  const requestConfigWithoutAuthHeader = {
    baseURL: apiUrl,
  }

  const requestConfigWithAuthHeader = {
    ...requestConfigWithoutAuthHeader,
    headers: {
      [authHeader]: apiKey,
    },
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
      providerIndicatedTimePath: undefined,
    })

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

    const expectedResponse = {
      data: {
        result: expectedValue,
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: expectedValue,
      timestamps: {
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
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
      providerIndicatedTimePath: undefined,
    })

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

    const expectedResponse = {
      data: {
        result: expectedValue,
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: expectedValue,
      timestamps: {
        providerIndicatedTimeUnixMs: undefined,
      },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
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
      providerIndicatedTimePath: undefined,
    })

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

    const expectedResponse = {
      errorMessage: "Data path 'something.invalid' not found in response for 'test'",
      statusCode: 500,

      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
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
      providerIndicatedTimePath: undefined,
    })

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

    const expectedResponse = {
      errorMessage: "Ripcord activated for 'test'",
      ripcord: true,
      ripcordAsInt: 1,
      ripcordDetails: undefined,
      statusCode: 503,

      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should convert providerIndicatedTimePath ISO string to providerIndicatedTimeUnixMs', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }

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

    const result = '1.0043732667449965'
    const expectedResponse = {
      data: {
        result,
      },
      result,
      timestamps: {
        providerIndicatedTimeUnixMs: 1768805782194,
      },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should convert providerIndicatedTimePath Unix ms number to providerIndicatedTimeUnixMs', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }

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

    const result = '1.0043732667449965'
    const expectedResponse = {
      data: {
        result,
      },
      result,
      timestamps: {
        providerIndicatedTimeUnixMs: 1768805782194,
      },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should return an error if providerIndicatedTimePath is not found', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'non_existent_timestamp',
    }

    const response = {
      response: {
        data: {
          net_asset_value: 1.0,
        },
        cost: undefined,
      },
      timestamps: {},
    }

    const expectedResponse = {
      errorMessage:
        "Provider indicated time path 'non_existent_timestamp' not found in response for 'test'",
      statusCode: 500,
      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should return an error if providerIndicatedTimePath value is invalid', async () => {
    process.env.TEST_API_URL = apiUrl
    process.env.TEST_AUTH_HEADER = authHeader
    process.env.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
      providerIndicatedTimePath: 'updatedAt',
    }

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

    const expectedResponse = {
      errorMessage: "Invalid timestamp value at 'updatedAt' for 'test'",
      statusCode: 500,
      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should include ripcordDetails in error message when ripcord is activated (the-network-firm pattern)', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

    const response = {
      response: {
        data: {
          result: 1.0,
          ripcord: true,
          ripcordDetails: ['Price deviation too high', 'Stale data detected'],
        },
        cost: undefined,
      },
      timestamps: {},
    }

    const expectedResponse = {
      errorMessage:
        "Ripcord activated for 'test'. Details: Price deviation too high, Stale data detected",
      ripcord: true,
      ripcordAsInt: 1,
      ripcordDetails: 'Price deviation too high, Stale data detected',
      statusCode: 503,
      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should handle empty ripcordDetails array', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      errorMessage: "Ripcord activated for 'test'",
      ripcord: true,
      ripcordAsInt: 1,
      ripcordDetails: undefined,
      statusCode: 503,
      timestamps: {},
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should include ripcord status in data when ripcord is false', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      data: {
        result: '1.004373',
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: '1.004373',
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should not include ripcord status when ripcord path is absent', async () => {
    process.env.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPath: 'net_asset_value',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      data: {
        result: '1.004373',
      },
      result: '1.004373',
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })
})
