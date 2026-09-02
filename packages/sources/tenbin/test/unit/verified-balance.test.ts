import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/verified-balance'
import { VerifiedBalanceTransport } from '../../src/transport/verified-balance'

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

describe('VerifiedBalanceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'verified-balance'
  const API_ENDPOINT = 'http://api.example.com'
  const API_KEY = 'test-api-key'
  const BACKGROUND_EXECUTE_MS = 10_000

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT,
    API_KEY,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: VerifiedBalanceTransport

  type RequestConfig = {
    baseURL: string
    url: string
    method: 'POST'
    headers: Record<string, string>
    data: {
      symbol: string
      convert: string
    }
  }

  const requestConfigForParams = ({
    base,
    quote,
  }: {
    base: string
    quote: string
  }): RequestConfig => ({
    method: 'POST',
    baseURL: adapterSettings.API_ENDPOINT,
    url: '/cryptocurrency/price',
    headers: {
      X_API_KEY: adapterSettings.API_KEY,
    },
    data: {
      symbol: base.toUpperCase(),
      convert: quote.toUpperCase(),
    },
  })

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: requestConfig.data,
      transportName,
    })
    return requestKey
  }

  const mockPriceResponse = (symbol: string, price: number | Promise<number>) => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: {
            [symbol.toUpperCase()]: {
              price: await price,
            },
          },
        },
      }
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new VerifiedBalanceTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('backgroundHandler', () => {
    it('should sleep after handleRequest', async () => {
      const t0 = Date.now()
      let t1 = 0
      transport.backgroundHandler(context, []).then(() => {
        t1 = Date.now()
      })
      await jest.runAllTimersAsync()
      expect(t1 - t0).toBe(BACKGROUND_EXECUTE_MS)
    })
  })

  describe('handleRequest', () => {
    it('should cache response', async () => {
      const from = 'ETH'
      const to = 'USD'
      const price = 2100

      const params = makeStub('params', {
        base: from,
        quote: to,
      })

      mockPriceResponse(from, price)

      await transport.handleRequest(params)

      const expectedResult = price

      const expectedResponse = {
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return price response', async () => {
      const from = 'ETH'
      const to = 'USD'
      const price = 2100

      const params = makeStub('params', {
        base: from,
        quote: to,
      })

      mockPriceResponse(from, price)
      const response = await transport._handleRequest(params)

      const expectedResult = price

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedRequestConfig = requestConfigForParams(params)
      const expectedRequestKey = requestKeyForConfig(expectedRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(expectedRequestKey, expectedRequestConfig)
      expect(requester.request).toHaveBeenCalledTimes(1)
    })

    it('should throw if response does not include price', async () => {
      const from = 'ETH'
      const to = 'USD'
      const price = undefined as unknown as number

      const params = makeStub('params', {
        base: from,
        quote: to,
      })

      mockPriceResponse(from, price)
      expect(() => transport._handleRequest(params)).rejects.toThrow(
        `The data provider didn't return any value for ${params.base}/${params.quote}`,
      )
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const from = 'ETH'
      const to = 'USD'
      const price = 2100

      const params = makeStub('params', {
        base: from,
        quote: to,
      })

      const [pricePromise, resolvePrice] = deferredPromise<number>()
      mockPriceResponse(from, pricePromise)

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(params)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolvePrice(price)

      const expectedResult = price
      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })
  })
})
