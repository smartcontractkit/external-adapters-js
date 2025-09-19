import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/nav'
import { getPubKeys, HttpTransportTypes, NavTransport } from '../../src/transport/nav'
import { validateResponseSignature } from '../../src/transport/sigutils'

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
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)
metrics.initialize()

// Mock the signature validation module before importing the transport
jest.mock('../../src/transport/sigutils', () => ({
  validateResponseSignature: jest.fn(),
}))
const mockedValidateResponseSignature = validateResponseSignature as jest.MockedFunction<
  typeof validateResponseSignature
>

describe('nav transport', () => {
  const keyA = 'keyA'
  const keyB = 'keyB'

  describe('getPubKeys', () => {
    beforeAll(() => {
      process.env.TEST_PUBKEYS = `${keyA},${keyB}`
      process.env.SINGLE_PUBKEYS = keyA
    })

    it('should return expected data with existing prefix', async () => {
      const actualPubKeys = getPubKeys('test')
      expect(actualPubKeys).toEqual([keyA, keyB])
    })

    it('should throw error for non-existent prefix', async () => {
      expect(() => getPubKeys('nonexistent')).toThrow()
    })

    it('should handle single pubkey', async () => {
      const actualPubKeys = getPubKeys('single')
      expect(actualPubKeys).toEqual([keyA])
    })

    it('should handle empty pubkey list', async () => {
      process.env.EMPTY_PUBKEY = ''
      expect(() => getPubKeys('empty')).toThrow()
    })
  })

  describe('NavTransport', () => {
    const transportName = 'default_single_transport'
    const endpointName = 'nav'

    const adapterSettings = makeStub('adapterSettings', {
      API_ENDPOINT: 'https://partners-api.securitize.io/asset-metrics/api/v1/nav',
      API_KEY: 'fake-api-key',
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

    let transport: NavTransport

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

      process.env.TEST_PUBKEYS = `${keyA},${keyB}`
      process.env.SINGLE_PUBKEYS = keyA

      // Mock signature validation to not throw
      mockedValidateResponseSignature.mockImplementation(() => undefined)

      transport = new NavTransport()

      await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
    })

    it('should make the request', async () => {
      const assetId = 'abc123'
      const expectedNav = 123.45
      const envVarPrefix = 'test'
      const dateString = '2025-09-11T00:00:00.000Z'
      const dateStringAsTime = 1757548800000

      const params = makeStub('params', {
        assetId,
        envVarPrefix,
      })
      subscriptionSet.getAll.mockReturnValue([params])

      const context = makeStub('context', {
        adapterSettings,
        endpointName,
      } as EndpointContext<HttpTransportTypes>)

      const response = makeStub('response', {
        response: {
          data: {
            docs: [
              {
                assetId: assetId,
                nav: expectedNav,
                recordDate: dateString,
                seqNum: 12345,
                signedMessage: {
                  signature:
                    '7a501db571c6415d5647b582885bb8d816157a0d6ddf4154d001d826c71271a9f31fa21eaf05383950a5c758057b8f1969bd94d28d22f10561a9369f1489e006',
                  content:
                    '63353263336437392d383331372d343639322d383666382d3465306466643530383637327c7c317c7c323032352d30392d31315430303a30303a30302e3030305a7c7c31323334357c7c7c7c',
                  hash: 'c7f835a4c98b8f3380b96b7e1d426642f3b06395c7821d3a7372d80d561f69ae',
                  prevSig: null,
                  prevContent: null,
                  prevHash: null,
                },
              },
            ],
            cost: {},
          },
        },
        timestamps: {},
      })

      requester.request.mockResolvedValue(response)

      await transport.backgroundExecute(context)

      const expectedRequestConfig = {
        headers: {
          apikey: adapterSettings.API_KEY,
        },
        baseURL: adapterSettings.API_ENDPOINT,
        params: {
          assetId,
          sortBy: 'recordDate',
          sortOrder: 'DESC',
          page: 1,
          limit: 1,
        },
      }
      const expectedRequestKey = requestKeyForParams(params)

      const expectedResponse = {
        data: {
          result: expectedNav,
        },
        result: expectedNav,
        timestamps: {
          providerIndicatedTimeUnixMs: dateStringAsTime,
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
  })
})
