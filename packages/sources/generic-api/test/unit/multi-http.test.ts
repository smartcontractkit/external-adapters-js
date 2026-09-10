import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  LoggerFactoryProvider,
  PartialAdapterResponse,
  ResponseTimestamps,
} from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters, RequestParams } from '../../src/endpoint/multi-http'
import { MultiHttpTransport } from '../../src/transport/multi-http'

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

  let fakeEnv: Record<string, string> = {}

  const adapterSettings = makeStub('adapterSettings', {
    API_NAME_API_URL: {
      get(apiName: string) {
        const envVarName = `${apiName.toUpperCase()}_API_URL`
        if (!(envVarName in fakeEnv)) {
          throw new Error(`Missing required environment variable '${envVarName}'.`)
        }
        return fakeEnv[`${apiName.toUpperCase()}_API_URL`]
      },
    },
    API_NAME_AUTH_HEADER: {
      get(apiName: string) {
        return fakeEnv[`${apiName.toUpperCase()}_AUTH_HEADER`]
      },
    },
    API_NAME_AUTH_HEADER_VALUE: {
      get(apiName: string) {
        return fakeEnv[`${apiName.toUpperCase()}_AUTH_HEADER_VALUE`]
      },
    },
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

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
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: MultiHttpTransport

  const requestKeyForParams = (params: typeof inputParameters.validated) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
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
    fakeEnv = {}
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new MultiHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

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
    }
    expectedResponse: PartialAdapterResponse<BaseEndpointTypes['Response']> & {
      statusCode?: number
      timestamps?: Partial<ResponseTimestamps>
    }
  }) => {
    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<BaseEndpointTypes>)

    requester.request.mockResolvedValue(response)

    await transport.handleRequest(context, params)

    const expectedRequestKey = requestKeyForParams(params)

    expect(requester.request).toHaveBeenCalledWith(expectedRequestKey, expectedRequestConfig)
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          ...expectedResponse,
          statusCode: expectedResponse.statusCode ?? 200,
          timestamps: {
            ...expectedResponse.timestamps,
            providerDataRequestedUnixMs: Date.now(),
            providerDataReceivedUnixMs: Date.now(),
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  }

  it('should extract multiple data paths from response', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should convert providerIndicatedTimePath ISO string to providerIndicatedTimeUnixMs', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
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

    const expectedResponse = {
      data: {
        nav: 1.0043732667449965,
      },
      result: null,
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
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
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

    const expectedResponse = {
      data: {
        nav: 1.0043732667449965,
      },
      result: null,
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
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
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
        "Provider indicated time path 'non_existent_timestamp' not found in response for 'TEST'",
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
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
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
      errorMessage: "Invalid timestamp value at 'updatedAt' for 'TEST'",
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

  it('should return an error if data path is not found', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'missing', path: 'non_existent_field' },
      ],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
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
      errorMessage: "Data path 'non_existent_field' not found in response for 'TEST'",
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

  it('should return an error if ripcord is activated', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      errorMessage: "Ripcord activated for 'TEST'",
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

  it('should return an error if response data is empty', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }

    const response = {
      response: {
        data: null,
        cost: undefined,
      },
      timestamps: {},
    }

    const expectedResponse = {
      errorMessage: "The data provider for TEST didn't return any value",
      statusCode: 502,
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
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<BaseEndpointTypes>)

    await expect(() => transport._handleRequest(context, params)).rejects.toThrow(
      "Missing required environment variable 'TEST_API_URL'.",
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
  })

  it('should work without auth headers', async () => {
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'nav', path: 'net_asset_value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
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
      data: { nav: 1.0 },
      result: null,
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should handle nested data paths', async () => {
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'value', path: 'data.nested.value' }],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      data: { value: 42 },
      result: null,
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should extract result field as primary result (view-function-multi-chain pattern)', async () => {
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [
        { name: 'result', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      data: {
        result: 1.004373,
        aum: 30127047.47,
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: 1.004373,
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should include ripcordDetails in error message when ripcord is activated (the-network-firm pattern)', async () => {
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
      ripcordPath: 'ripcord',
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      errorMessage:
        "Ripcord activated for 'TEST'. Details: Price deviation too high, Stale data detected",
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
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
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
      errorMessage: "Ripcord activated for 'TEST'",
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
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [{ name: 'result', path: 'net_asset_value' }],
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
        result: 1.004373,
        ripcord: false,
        ripcordAsInt: 0,
      },
      result: 1.004373,
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should return null result when result field not in dataPaths (backward compatible)', async () => {
    fakeEnv.TEST_API_URL = apiUrl

    const params = {
      apiName,
      dataPaths: [
        { name: 'nav', path: 'net_asset_value' },
        { name: 'aum', path: 'asset_under_management' },
      ],
      ripcordPath: undefined,
      ripcordDisabledValue: 'false',
    }

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

    const expectedResponse = {
      data: {
        nav: 1.004373,
        aum: 30127047.47,
      },
      result: null,
      timestamps: { providerIndicatedTimeUnixMs: undefined },
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithoutAuthHeader,
      response,
      expectedResponse,
    })
  })

  it('should handle full OpenDelta NX8 scenario', async () => {
    fakeEnv.TEST_API_URL = apiUrl
    fakeEnv.TEST_AUTH_HEADER = authHeader
    fakeEnv.TEST_AUTH_HEADER_VALUE = apiKey

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

    const expectedResponse = {
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
    }

    await doTransportTest({
      params,
      expectedRequestConfig: requestConfigWithAuthHeader,
      response,
      expectedResponse,
    })
  })
})
