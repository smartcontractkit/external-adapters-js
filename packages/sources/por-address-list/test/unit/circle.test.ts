import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/circle'
import { CircleTransport } from '../../src/transport/circle'

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

describe('CircleTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'circle'
  const apiUrl = 'http://api.example.com'
  const BACKGROUND_EXECUTE_MS = 10_000

  const adapterSettings = makeStub('adapterSettings', {
    CIRCLE_API_URL: apiUrl,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    DEFAULT_CACHE_KEY: 'default_cache_key',
    BACKGROUND_EXECUTE_MS,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

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

  let transport: CircleTransport

  const requestKeyForParams = (params: Record<string, never>) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters: new InputParameters({}),
        endpointName,
      },
      data: params,
      transportName,
    })
    return requestKey
  }

  const mockAddressListResponse = (
    addresses: { address: string }[] | Promise<{ address: string }[]>,
  ) => {
    requester.request.mockImplementationOnce(async () => {
      return makeStub('response', {
        response: {
          data: {
            data: await addresses,
          },
        },
      })
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new CircleTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
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
    it('should cache the response', async () => {
      const address = '1FXxhAa9yKCG8WgCTrbSsdGKuC6QzN3Gq9'
      const params = makeStub('params', {})

      mockAddressListResponse([{ address }])

      await transport.handleRequest(params)

      const expectedRequestConfig = {
        baseURL: adapterSettings.CIRCLE_API_URL,
      }
      const expectedRequestKey = requestKeyForParams(params)

      const expectedResponse = {
        result: null,
        data: {
          result: [
            {
              address,
              network: 'bitcoin',
              chainId: 'mainnet',
            },
          ],
        },
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      }

      expect(requester.request).toHaveBeenCalledWith(expectedRequestKey, expectedRequestConfig)
      expect(requester.request).toHaveBeenCalledTimes(1)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })

    it('should return an error for invalid addresses', async () => {
      const invalidAddress = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      const params = makeStub('params', {})

      mockAddressListResponse([{ address: invalidAddress }])

      await transport.handleRequest(params)

      const expectedRequestConfig = {
        baseURL: adapterSettings.CIRCLE_API_URL,
      }
      const expectedRequestKey = requestKeyForParams(params)

      const expectedResponse = {
        errorMessage: `Invalid Bitcoin address returned from data provider: '${invalidAddress}'`,
        statusCode: 502,
        timestamps: {
          providerDataReceivedUnixMs: 0,
          providerDataRequestedUnixMs: 0,
        },
      }

      expect(requester.request).toHaveBeenCalledWith(expectedRequestKey, expectedRequestConfig)
      expect(requester.request).toHaveBeenCalledTimes(1)

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toHaveBeenCalledTimes(1)

      expect(log).toHaveBeenCalledWith(
        new AdapterError({
          message: `Invalid Bitcoin address returned from data provider: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`,
          statusCode: 502,
        }),
        `Invalid Bitcoin address returned from data provider: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`,
      )
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should record received timestamp separate from requested timestamp', async () => {
      const address = '1FXxhAa9yKCG8WgCTrbSsdGKuC6QzN3Gq9'
      const params = makeStub('params', {})

      const [addressListPromise, resolveAddressList] = deferredPromise<{ address: string }[]>()

      mockAddressListResponse(addressListPromise)

      const requestTimestamp = Date.now()
      const handlePromise = transport._handleRequest(params)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveAddressList([{ address }])

      const expectedResponse = {
        result: null,
        data: {
          result: [
            {
              address,
              network: 'bitcoin',
              chainId: 'mainnet',
            },
          ],
        },
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
        },
      }
      expect(await handlePromise).toEqual(expectedResponse)
    })
  })
})
