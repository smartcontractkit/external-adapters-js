import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/price'
import { PriceTransport } from '../../src/transport/price'

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

describe('PriceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'price'
  const DATA_ENGINE_ADAPTER_URL = 'https://data.engine'
  const BACKGROUND_EXECUTE_MS = 1000
  const XAU_FEED_ID = '0x0008991d4caf73e8e05f6671ef43cee5e8c5c3652a35fde0b0942e44a77b0e89'

  const adapterSettings = makeStub('adapterSettings', {
    DATA_ENGINE_ADAPTER_URL,
    XAU_FEED_ID,
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

  let transport: PriceTransport

  const mockXauPriceResponse = (midPrice: Promise<string> | string) => {
    requester.request.mockImplementationOnce(async () =>
      makeStub('mockDataEngineResponse', {
        response: {
          data: {
            data: {
              midPrice: await midPrice,
              decimals: 18,
            },
          },
        },
      }),
    )
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new PriceTransport()

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
      const goldPrice = '4789000000000000000000'

      mockXauPriceResponse(goldPrice)

      const param = makeStub('param', {})
      await transport.handleRequest(param)

      const expectedResult = goldPrice

      const expectedResponse = {
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)

      expect(log).toBeCalledTimes(0)
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should return price response', async () => {
      const goldPrice = '4789000000000000000000'

      mockXauPriceResponse(goldPrice)

      const param = makeStub('param', {})
      const response = await transport._handleRequest(param)

      const expectedResult = goldPrice

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toBeCalledTimes(0)
      log.mockClear()
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const goldPrice = '4789000000000000000000'
      const [pricePromise, resolvePrice] = deferredPromise<string>()

      mockXauPriceResponse(pricePromise)

      const param = makeStub('param', {})

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolvePrice(goldPrice)

      const expectedResult = goldPrice
      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      log.mockClear()
    })
  })
})
