import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/nav'
import { httpTransport, HttpTransportTypes, ResponseSchema } from '../../src/transport/nav'

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

describe('NavHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'nav'

  const apiEndpoint = 'https://mapi.matrixport.com'
  const apiKey = 'test-api-key'
  const apiSecret = 'test-api-secret'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: apiEndpoint,
    API_KEY: apiKey,
    API_SECRET: apiSecret,
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
    jest.setSystemTime(new Date('2026-02-13T12:00:00.000Z'))

    await httpTransport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('successful requests', () => {
    it('should make the request and parse successful response', async () => {
      const params = makeStub('params', {
        symbol: 'XAUM',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 0,
        message: 'success',
        data: {
          round_id: '7424696115074699264',
          last_updated_timestamp: 1770185497979,
          symbol: 'XAUM',
          issue_price: '5115.355',
          redeem_price: '5037.982',
        },
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      const expectedRequestKey = requestKeyForParams(params)

      expect(requester.request).toHaveBeenCalledWith(
        expectedRequestKey,
        expect.objectContaining({
          baseURL: apiEndpoint,
          url: '/rwa/api/v1/quote/price',
          params: { symbol: 'XAUM' },
          headers: expect.objectContaining({
            'X-MatrixPort-Access-Key': apiKey,
            'X-Auth-Version': 'v2',
            'X-Timestamp': expect.any(String),
            'X-Signature': expect.any(String),
          }),
        }),
        undefined,
      )
      expect(requester.request).toHaveBeenCalledTimes(1)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: {
            result: 5115.355,
            data: {
              result: 5115.355,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: 1770185497979,
            },
          },
        },
      ])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })

    it('should correctly parse issue_price as a number', async () => {
      const params = makeStub('params', {
        symbol: 'XAUM',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 0,
        message: 'success',
        data: {
          round_id: '123',
          last_updated_timestamp: 1770185497979,
          symbol: 'XAUM',
          issue_price: '1234.56789',
          redeem_price: '1230.00',
        },
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: expect.objectContaining({
            result: 1234.56789,
            data: {
              result: 1234.56789,
            },
          }),
        },
      ])
    })
  })

  describe('error responses', () => {
    it('should return error when API returns non-zero code', async () => {
      const params = makeStub('params', {
        symbol: 'INVALID',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 1001,
        message: 'Invalid symbol',
        data: null,
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: {
            errorMessage: 'Invalid symbol',
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    })

    it('should return error when data is null', async () => {
      const params = makeStub('params', {
        symbol: 'XAUM',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 0,
        message: 'success',
        data: null,
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: {
            errorMessage: 'success',
            statusCode: 502,
            timestamps: {
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    })
  })

  describe('request construction', () => {
    it('should include correct authentication headers', async () => {
      const params = makeStub('params', {
        symbol: 'XAUM',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 0,
        message: 'success',
        data: {
          round_id: '123',
          last_updated_timestamp: 1770185497979,
          symbol: 'XAUM',
          issue_price: '5115.355',
          redeem_price: '5037.982',
        },
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      const requestCall = requester.request.mock.calls[0]
      const requestConfig = requestCall[1]

      expect(requestConfig.headers).toMatchObject({
        'X-MatrixPort-Access-Key': apiKey,
        'X-Auth-Version': 'v2',
      })
      expect(requestConfig.headers['X-Timestamp']).toBeDefined()
      expect(requestConfig.headers['X-Signature']).toBeDefined()
      // Signature should be 64 characters (256 bits hex)
      expect(requestConfig.headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should use correct API path and query params', async () => {
      const params = makeStub('params', {
        symbol: 'XAUM',
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const apiResponseData: ResponseSchema = {
        code: 0,
        message: 'success',
        data: {
          round_id: '123',
          last_updated_timestamp: 1770185497979,
          symbol: 'XAUM',
          issue_price: '5115.355',
          redeem_price: '5037.982',
        },
      }

      const response = makeStub('response', {
        response: {
          data: {
            ...apiResponseData,
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await httpTransport.backgroundExecute(context)

      const requestCall = requester.request.mock.calls[0]
      const requestConfig = requestCall[1]

      expect(requestConfig.baseURL).toBe(apiEndpoint)
      expect(requestConfig.url).toBe('/rwa/api/v1/quote/price')
      expect(requestConfig.params).toEqual({ symbol: 'XAUM' })
    })
  })
})
