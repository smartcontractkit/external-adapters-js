import { EndpointContext, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/price'
import { updateEma } from '../../src/transport/ema'
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
  const XAUT_FEED_ID = '0x0003b8b3f33c4c06a7947e86c5b4db4ef0991637d9821b9cdf897c0b5d488468'
  const PAXG_FEED_ID = '0x0003b4b1d926719d4f67a08c9ffe9baf688620058c9f029923ea504eb71c877f'
  const TOKENIZED_GOLD_PRICE_STREAMS = `{
    "XAUT": "${XAUT_FEED_ID}",
    "PAXG": "${PAXG_FEED_ID}"
  }`
  const PRICE_STALE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
  const PREMIUM_EMA_TAU_MS = 1_000_000
  const DEVIATION_EMA_TAU_MS = 1_000_000
  const RESULT_DECIMALS = 18

  const adapterSettings = makeStub('adapterSettings', {
    DATA_ENGINE_ADAPTER_URL,
    XAU_FEED_ID,
    TOKENIZED_GOLD_PRICE_STREAMS,
    PRICE_STALE_TIMEOUT_MS,
    PREMIUM_EMA_TAU_MS,
    DEVIATION_EMA_TAU_MS,
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

  const priceStreamMocks: Record<string, jest.Mock> = {}

  const mockDataEngine = (feedId: string) => {
    return (priceStreamMocks[feedId] ??= jest.fn())
  }

  let xauClosingPrice: bigint
  let marketLastOpenTimestamp: number

  const mockXauPriceResponse = (
    midPrice: Promise<string> | string,
    marketStatus: MarketStatus,
    decimals = 18,
  ) => {
    mockDataEngine(XAU_FEED_ID).mockImplementationOnce(async () => {
      const midPriceValue = await midPrice
      if (marketStatus === MarketStatus.OPEN) {
        marketLastOpenTimestamp = Date.now()
      } else {
        xauClosingPrice = BigInt(midPriceValue)
      }
      return makeStub('mockDataEngineResponse', {
        response: {
          data: {
            data: {
              marketStatus,
              midPrice: midPriceValue,
              decimals,
            },
          },
        },
      })
    })
  }

  const mockCryptoPrice = (feedId: string, price: string | Promise<string>, decimals = 18) => {
    mockDataEngine(feedId).mockImplementationOnce(async () =>
      makeStub('mockDataEngineResponse', {
        response: {
          data: {
            data: {
              price: await price,
              decimals,
            },
          },
        },
      }),
    )
  }

  // Having this much logic in tests is not ideal but without it
  // there would just be magic numbers everywhere.
  const getExpectedDeviationAndResult = (
    expectedUnsmoothedCompositePrice: string,
  ): {
    expectedDeviation: string
    expectedResult: string
  } => {
    const unsmoothedDeviation =
      ((BigInt(expectedUnsmoothedCompositePrice) - xauClosingPrice) *
        10n ** BigInt(RESULT_DECIMALS)) /
      xauClosingPrice
    const expectedDeviation = updateEma(
      {
        average: 0n,
        timestampMs: marketLastOpenTimestamp,
      },
      unsmoothedDeviation,
      Date.now(),
      PREMIUM_EMA_TAU_MS,
    ).average
    const expectedResult = (
      xauClosingPrice +
      (expectedDeviation * xauClosingPrice) / 10n ** BigInt(RESULT_DECIMALS)
    ).toString()
    return {
      expectedDeviation: expectedDeviation.toString(),
      expectedResult,
    }
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    xauClosingPrice = 0n
    marketLastOpenTimestamp = 0

    requester.request.mockImplementation(async (requestJson) => {
      const request = JSON.parse(requestJson)
      return mockDataEngine(request.data.data.feedId)(request)
    })

    transport = new PriceTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('initialize', () => {
    it('should error if TOKENIZED_GOLD_PRICE_STREAMS is not valid JSON', async () => {
      const invalidJson = '{not: json}'
      const invalidConfig = { ...adapterSettings, TOKENIZED_GOLD_PRICE_STREAMS: invalidJson }

      const transportInstance = new PriceTransport()
      await expect(() =>
        transportInstance.initialize(dependencies, invalidConfig, endpointName, transportName),
      ).rejects.toThrow(
        "Failed to parse TOKENIZED_GOLD_PRICE_STREAMS from adapter config: SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)",
      )
    })
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
      const tokenizedGoldPrice = '5123000000000000000000'

      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice)

      const param = makeStub('param', {})
      await transport.handleRequest(param)

      const expectedResult = goldPrice

      const expectedResponse = {
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.OPEN,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now(),
            },
            deviationEma: {
              average: '0',
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
              PAXG: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
            },
          },
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

    it('should cache error response', async () => {
      const error = 'Stream error'
      const errorMessage = 'Unknown error occurred'
      const tokenizedGoldPrice = '5123000000000000000000'

      mockXauPriceResponse(Promise.reject('Stream error'), MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice)

      const param = makeStub('param', {})
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
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

      expect(log).toBeCalledWith(error, errorMessage)
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should return XAU price when market is open', async () => {
      const goldPrice = '4789000000000000000000'
      const tokenizedGoldPrice = '5123000000000000000000'

      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice)

      const param = makeStub('param', {})
      const response = await transport._handleRequest(param)

      const expectedResult = goldPrice

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.OPEN,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now(),
            },
            deviationEma: {
              average: '0',
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
              PAXG: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
            },
          },
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

    it('should return composite price when market is closed', async () => {
      const goldPrice = '4000000000000000000000'
      const xautPrice = '5100000000000000000000'
      const paxgPrice = '5300000000000000000000'
      const averagePrice = '5200000000000000000000'

      // Start out with all prices the same to have a premium factor if 1.
      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, goldPrice)
      mockCryptoPrice(PAXG_FEED_ID, goldPrice)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      jest.advanceTimersByTime(1000)
      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } = getExpectedDeviationAndResult(averagePrice)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: marketLastOpenTimestamp,
            },
            deviationEma: {
              average: expectedDeviation,
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: xautPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
              PAXG: {
                lastPrice: paxgPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
            },
          },
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

    it('should adjust for premium tokenized prices', async () => {
      const goldPrice = '4000000000000000000000'
      const xautPrice1 = '4500000000000000000000'
      const paxgPrice1 = '5000000000000000000000'
      const xautPrice2 = '4455000000000000000000' // 1.0% lower
      const paxgPrice2 = '4975000000000000000000' // 0.5% lower
      const expectedCompositePrice = '3970000000000000000000' // 0.75% lower than goldPrice

      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice1)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice1)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      jest.advanceTimersByTime(1000)
      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice2)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice2)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } =
        getExpectedDeviationAndResult(expectedCompositePrice)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: marketLastOpenTimestamp,
            },
            deviationEma: {
              average: expectedDeviation,
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: xautPrice2,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: xautPrice1,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
              PAXG: {
                lastPrice: paxgPrice2,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: paxgPrice1,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
            },
          },
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

    it('should use EMA to determine premium', async () => {
      const goldPrice = '4000000000000000000000'
      const xautPrice1 = '4500000000000000000000'
      const paxgPrice1 = '5000000000000000000000'
      const xautPrice2 = '4455000000000000000000' // 1.0% lower
      const paxgPrice2 = '4975000000000000000000' // 0.5% lower
      const xautExpectedAverage = '4477500004062599136000' // ~0.5% lower
      const paxgExpectedAverage = '4987500002256999520000' // ~0.25% lower
      const expectedCompositePrice = '3984937214707049634622' // ~0.375% lower than goldPrice

      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice1)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice1)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      // This is the half-life of the EMA so we expect the
      // composite price to be twice as close to the gold price
      // compared to the previous test.
      jest.advanceTimersByTime(Math.log(2) * PREMIUM_EMA_TAU_MS)

      const lastPriceChangeTimestampMs = Date.now()
      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice2)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice2)

      await transport._handleRequest(param)

      jest.advanceTimersByTime(1000)
      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice2)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice2)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } =
        getExpectedDeviationAndResult(expectedCompositePrice)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: marketLastOpenTimestamp,
            },
            deviationEma: {
              average: expectedDeviation,
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: xautPrice2,
                lastPriceChangeTimestampMs,
                openMarketEma: {
                  average: xautExpectedAverage,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
              PAXG: {
                lastPrice: paxgPrice2,
                lastPriceChangeTimestampMs,
                openMarketEma: {
                  average: paxgExpectedAverage,
                  timestampMs: marketLastOpenTimestamp,
                },
              },
            },
          },
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

    it('should use other tokenized stream if one gives an error', async () => {
      const error = 'Stream error'
      const goldPrice = '4000000000000000000000'
      const xautPrice = Promise.reject(error)
      const paxgPrice = '5300000000000000000000'

      // Start out with all prices the same to have a premium factor if 1.
      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, goldPrice)
      mockCryptoPrice(PAXG_FEED_ID, goldPrice)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      // Advance time to make sure previous price is not used.
      const interval = PRICE_STALE_TIMEOUT_MS + 1000
      jest.advanceTimersByTime(interval)

      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } = getExpectedDeviationAndResult(paxgPrice)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now() - interval,
            },
            deviationEma: {
              average: expectedDeviation,
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: goldPrice,
                lastPriceChangeTimestampMs: Date.now() - PRICE_STALE_TIMEOUT_MS - 1000,
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - interval,
                },
              },
              PAXG: {
                lastPrice: paxgPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - interval,
                },
              },
            },
          },
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toBeCalledWith(`Error fetching XAUT price: ${error}`)
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should fall back on gold closing price if both streams have errors', async () => {
      const error = 'Stream error'
      const goldPrice = '4000000000000000000000'
      const xautPrice = Promise.reject(error)
      const paxgPrice = Promise.reject(error)

      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      const param = makeStub('param', {})
      const response = await transport._handleRequest(param)

      const expectedResult = goldPrice

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            deviationEma: {
              average: '0',
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: '0',
                lastPriceChangeTimestampMs: 0,
              },
              PAXG: {
                lastPrice: '0',
                lastPriceChangeTimestampMs: 0,
              },
            },
          },
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toBeCalledWith(`Error fetching XAUT price: ${error}`)
      expect(log).toBeCalledWith(`Error fetching PAXG price: ${error}`)
      expect(log).toBeCalledTimes(2)
      log.mockClear()
    })

    it('should use previous price if stream gives error', async () => {
      const error = 'Stream error'
      const goldPrice = '4000000000000000000000'
      const xautPrice = '5100000000000000000000'
      const paxgPrice = '5300000000000000000000'
      const averagePrice = '5200000000000000000000'

      // Start out with all prices the same to have a premium factor if 1.
      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, goldPrice)
      mockCryptoPrice(PAXG_FEED_ID, goldPrice)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice)
      mockCryptoPrice(PAXG_FEED_ID, Promise.reject(error))

      await transport._handleRequest(param)

      jest.advanceTimersByTime(1000)
      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, Promise.reject(error))
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } = getExpectedDeviationAndResult(averagePrice)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now() - 1000,
            },
            deviationEma: {
              average: expectedDeviation.toString(),
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: xautPrice,
                // Price is from 1 second ago
                lastPriceChangeTimestampMs: Date.now() - 1000,
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - 1000,
                },
              },
              PAXG: {
                lastPrice: paxgPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - 1000,
                },
              },
            },
          },
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toBeCalledWith(`Error fetching PAXG price: ${error}`)
      expect(log).toBeCalledWith(`Error fetching XAUT price: ${error}`)
      expect(log).toBeCalledTimes(2)
      log.mockClear()
    })

    it('should not use stale price even without error', async () => {
      const goldPrice = '4000000000000000000000'
      const xautPrice1 = '5100000000000000000000'
      const xautPrice2 = '5110000000000000000000'
      const paxgPrice = '5300000000000000000000'

      // Start out with all prices the same to have a premium factor if 1.
      mockXauPriceResponse(goldPrice, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, goldPrice)
      mockCryptoPrice(PAXG_FEED_ID, goldPrice)

      const param = makeStub('param', {})
      await transport._handleRequest(param)

      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice1)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      await transport._handleRequest(param)

      const interval = PRICE_STALE_TIMEOUT_MS + 1000
      jest.advanceTimersByTime(interval)
      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, xautPrice2)
      mockCryptoPrice(PAXG_FEED_ID, paxgPrice)

      const response = await transport._handleRequest(param)

      const { expectedDeviation, expectedResult } = getExpectedDeviationAndResult(xautPrice2)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
          decimals: 18,
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.CLOSED,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now() - interval,
            },
            deviationEma: {
              average: expectedDeviation.toString(),
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: xautPrice2,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - interval,
                },
              },
              PAXG: {
                lastPrice: paxgPrice,
                lastPriceChangeTimestampMs: Date.now() - interval,
                openMarketEma: {
                  average: goldPrice,
                  timestampMs: Date.now() - interval,
                },
              },
            },
          },
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

    it('should throw if XAU decimals differ from 18', async () => {
      const goldPrice = '4789000000000000000000'
      const tokenizedGoldPrice = '5123000000000000000000'

      mockXauPriceResponse(goldPrice, MarketStatus.OPEN, 8)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice)

      const param = makeStub('param', {})
      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        'Unexpected XAU price stream decimals: 8, expected: 18',
      )

      expect(log).toBeCalledTimes(0)
      log.mockClear()
    })

    it('should throw if PAXG decimals differ from 18', async () => {
      const goldPrice = '4789000000000000000000'
      const tokenizedGoldPrice = '5123000000000000000000'

      mockXauPriceResponse(goldPrice, MarketStatus.CLOSED)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice, 8)

      const param = makeStub('param', {})
      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        'Unexpected PAXG price stream decimals: 8, expected: 18',
      )

      expect(log).toBeCalledTimes(0)
      log.mockClear()
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const goldPrice = '4789000000000000000000'
      const tokenizedGoldPrice = '5123000000000000000000'
      const [pricePromise, resolvePrice] = deferredPromise<string>()

      mockXauPriceResponse(pricePromise, MarketStatus.OPEN)
      mockCryptoPrice(XAUT_FEED_ID, tokenizedGoldPrice)
      mockCryptoPrice(PAXG_FEED_ID, tokenizedGoldPrice)

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
          state: {
            lastXauPrice: goldPrice,
            marketStatus: MarketStatus.OPEN,
            nowMs: Date.now(),
            xauOpenMarketEma: {
              average: goldPrice,
              timestampMs: Date.now(),
            },
            deviationEma: {
              average: '0',
              timestampMs: Date.now(),
            },
            tokenizedStreams: {
              XAUT: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
              PAXG: {
                lastPrice: tokenizedGoldPrice,
                lastPriceChangeTimestampMs: Date.now(),
                openMarketEma: {
                  average: tokenizedGoldPrice,
                  timestampMs: Date.now(),
                },
              },
            },
          },
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
