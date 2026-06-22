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
    CIRCLE_API_PAGE_SIZE: 200,
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

  const requestKeyForParams = (params: { offset: number; limit: number }) => {
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

  const mockAddressListResponse = ({
    addresses,
    ripcord = false,
  }: {
    addresses: { address: string }[] | Promise<{ address: string }[]>
    ripcord?: unknown
  }) => {
    requester.request.mockImplementation(async (_key, { params: { offset, limit } }) => {
      return makeStub('response', {
        response: {
          data: {
            data: (await addresses).slice(offset, offset + limit),
            ripcord,
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

      mockAddressListResponse({ addresses: [{ address }] })

      await transport.handleRequest(params)

      const expectedRequestConfig1 = {
        baseURL: adapterSettings.CIRCLE_API_URL,
        params: {
          offset: 0,
          limit: 200,
        },
      }
      const expectedRequestKey1 = requestKeyForParams(expectedRequestConfig1.params)
      const expectedRequestConfig2 = {
        baseURL: adapterSettings.CIRCLE_API_URL,
        params: {
          offset: 1,
          limit: 200,
        },
      }
      const expectedRequestKey2 = requestKeyForParams(expectedRequestConfig2.params)

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

      expect(requester.request).toHaveBeenCalledWith(expectedRequestKey1, expectedRequestConfig1)
      expect(requester.request).toHaveBeenCalledWith(expectedRequestKey2, expectedRequestConfig2)
      expect(requester.request).toHaveBeenCalledTimes(2)

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

      mockAddressListResponse({ addresses: [{ address: invalidAddress }] })

      await transport.handleRequest(params)

      const expectedResponse = {
        errorMessage: `Invalid Bitcoin address returned from data provider: '${invalidAddress}'`,
        statusCode: 502,
        timestamps: {
          providerDataReceivedUnixMs: 0,
          providerDataRequestedUnixMs: 0,
        },
      }

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
    it('should fetch multiple pages of addresses', async () => {
      const pageSize = 2
      const addresses = [
        { address: '1K6KoYC69NnafWJ7YgtrpwJxBLiijWqwa6' },
        { address: '1AfCc4F9c4VTYSE31PUe2kUEKs6ZxiDjxm' },
        { address: '1N81BbZXXK2oQ4NXwV4ttmqQeAKiF4WP6q' },
        { address: '31v5xjehSuxvbEo62eSh7tCS6ajQzfxEqw' },
        { address: 'bc1q9ejzvrycq2hfp58fecnydvryq8284raeft6swd' },
      ]

      const params = makeStub('params', {})

      mockAddressListResponse({ addresses })

      transport = new CircleTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          CIRCLE_API_PAGE_SIZE: pageSize,
        },
        endpointName,
        transportName,
      )
      const response = await transport._handleRequest(params)

      const expectedRequestConfigs = [0, 2, 4, 5].map((offset) => ({
        baseURL: adapterSettings.CIRCLE_API_URL,
        params: {
          offset,
          limit: pageSize,
        },
      }))
      const expectedRequestKeys = expectedRequestConfigs.map((config) =>
        requestKeyForParams(config.params),
      )

      const expectedResponse = {
        result: null,
        data: {
          result: addresses.map(({ address }) => ({
            address,
            network: 'bitcoin',
            chainId: 'mainnet',
          })),
        },
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      }

      expect(requester.request).toHaveBeenCalledWith(
        expectedRequestKeys[0],
        expectedRequestConfigs[0],
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedRequestKeys[1],
        expectedRequestConfigs[1],
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedRequestKeys[2],
        expectedRequestConfigs[2],
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedRequestKeys[3],
        expectedRequestConfigs[3],
      )
      expect(requester.request).toHaveBeenCalledTimes(4)

      expect(response).toEqual(expectedResponse)
    })

    it('should throw if ripcord is true', async () => {
      const addresses = [{ address: '1K6KoYC69NnafWJ7YgtrpwJxBLiijWqwa6' }]

      const params = makeStub('params', {})

      mockAddressListResponse({ addresses, ripcord: true })

      expect(() => transport._handleRequest(params)).rejects.toThrowError(
        new AdapterError({
          message: 'The data provider returned { ripcord: true } for offset 0 and limit 200',
          statusCode: 502,
        }),
      )
    })

    it('should throw if ripcord is an unexpected value', async () => {
      const addresses = [{ address: '1K6KoYC69NnafWJ7YgtrpwJxBLiijWqwa6' }]

      const params = makeStub('params', {})

      mockAddressListResponse({ addresses, ripcord: 0 })

      expect(() => transport._handleRequest(params)).rejects.toThrowError(
        new AdapterError({
          message: 'The data provider returned { ripcord: 0 } for offset 0 and limit 200',
          statusCode: 502,
        }),
      )
    })

    it('should not throw if ripcord is undefined', async () => {
      const addresses = [{ address: '1K6KoYC69NnafWJ7YgtrpwJxBLiijWqwa6' }]

      const params = makeStub('params', {})

      mockAddressListResponse({ addresses, ripcord: undefined })

      const response = await transport._handleRequest(params)

      const expectedResponse = {
        result: null,
        data: {
          result: addresses.map(({ address }) => ({
            address,
            network: 'bitcoin',
            chainId: 'mainnet',
          })),
        },
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: Date.now(),
          providerDataRequestedUnixMs: Date.now(),
        },
      }

      expect(response).toEqual(expectedResponse)
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const address = '1FXxhAa9yKCG8WgCTrbSsdGKuC6QzN3Gq9'
      const params = makeStub('params', {})

      const [addressListPromise, resolveAddressList] = deferredPromise<{ address: string }[]>()

      mockAddressListResponse({ addresses: addressListPromise })

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
