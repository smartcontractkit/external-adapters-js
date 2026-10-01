import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/price'
import { OrderBookResponse, PriceTransport, TradeInfoResponse } from '../../src/transport/price'

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

describe('PriceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'price'
  const API_ENDPOINT = 'http://api.example.com'
  const BACKGROUND_EXECUTE_MS = 10_000

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT,
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

  type RequestConfig = {
    baseURL: string
    url: string
    method: 'GET'
  }

  const requestConfigForParams = ({
    id,
    apiEndpoint,
  }: {
    id: string
    apiEndpoint: 'tradeinfo' | 'orderbook'
  }): RequestConfig => ({
    method: 'GET',
    baseURL: adapterSettings.API_ENDPOINT,
    url: `${id}/${apiEndpoint}`,
  })

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    return requestConfig.url
  }

  const mockResponse = <T extends TradeInfoResponse | OrderBookResponse>(
    response: T | Promise<T>,
  ) => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: await response,
        },
      }
    })
  }

  beforeEach(async () => {
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
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2'
      const bid_volume = '3'
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = '3'
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      await transport.handleRequest(params)

      const expectedResponse = {
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
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
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2'
      const bid_volume = '3'
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = '3'
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      const response = await transport._handleRequest(params)

      expect(response).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedTradeInfoRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'tradeinfo',
      })
      const expectedTradeInfoRequestKey = requestKeyForConfig(expectedTradeInfoRequestConfig)

      const expectedOrderBookRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'orderbook',
      })
      const expectedOrderBookRequestKey = requestKeyForConfig(expectedOrderBookRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(
        expectedTradeInfoRequestKey,
        expectedTradeInfoRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedOrderBookRequestKey,
        expectedOrderBookRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should exclude ask price and mid price if there are no sell orders', async () => {
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2'
      const bid_volume = '3'
      const ask_price = undefined
      const ask_volume = undefined
      const mid_price = undefined
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [],
      })

      const response = await transport._handleRequest(params)

      expect(response).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedTradeInfoRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'tradeinfo',
      })
      const expectedTradeInfoRequestKey = requestKeyForConfig(expectedTradeInfoRequestConfig)

      const expectedOrderBookRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'orderbook',
      })
      const expectedOrderBookRequestKey = requestKeyForConfig(expectedOrderBookRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(
        expectedTradeInfoRequestKey,
        expectedTradeInfoRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedOrderBookRequestKey,
        expectedOrderBookRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should exclude bid price and mid price if there are no buy orders', async () => {
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = undefined
      const bid_volume = undefined
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = undefined
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      const response = await transport._handleRequest(params)

      expect(response).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedTradeInfoRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'tradeinfo',
      })
      const expectedTradeInfoRequestKey = requestKeyForConfig(expectedTradeInfoRequestConfig)

      const expectedOrderBookRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'orderbook',
      })
      const expectedOrderBookRequestKey = requestKeyForConfig(expectedOrderBookRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(
        expectedTradeInfoRequestKey,
        expectedTradeInfoRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedOrderBookRequestKey,
        expectedOrderBookRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should calculate mid price with decimals', async () => {
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2.0000000001'
      const bid_volume = '3'
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = '3.00000000005'
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      const response = await transport._handleRequest(params)

      expect(response).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedTradeInfoRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'tradeinfo',
      })
      const expectedTradeInfoRequestKey = requestKeyForConfig(expectedTradeInfoRequestConfig)

      const expectedOrderBookRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'orderbook',
      })
      const expectedOrderBookRequestKey = requestKeyForConfig(expectedOrderBookRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(
        expectedTradeInfoRequestKey,
        expectedTradeInfoRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedOrderBookRequestKey,
        expectedOrderBookRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should return price response with DISABLED market status', async () => {
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2'
      const bid_volume = '3'
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = '3'
      const trading_status_string = 'DISABLED'

      const params = makeStub('params', {
        base: id,
      })

      mockResponse({
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      })

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      const response = await transport._handleRequest(params)

      expect(response).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 0,
          trading_status_string,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const expectedTradeInfoRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'tradeinfo',
      })
      const expectedTradeInfoRequestKey = requestKeyForConfig(expectedTradeInfoRequestConfig)

      const expectedOrderBookRequestConfig = requestConfigForParams({
        id,
        apiEndpoint: 'orderbook',
      })
      const expectedOrderBookRequestKey = requestKeyForConfig(expectedOrderBookRequestConfig)

      expect(requester.request).toHaveBeenCalledWith(
        expectedTradeInfoRequestKey,
        expectedTradeInfoRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledWith(
        expectedOrderBookRequestKey,
        expectedOrderBookRequestConfig,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const id = '09befe9e-c95d-4856-ab4c-c811202a9cfb'

      const last_price = '1'
      const bid_price = '2'
      const bid_volume = '3'
      const ask_price = '4'
      const ask_volume = '5'
      const mid_price = '3'
      const trading_status_string = 'CONTINUOUS_TRADING'

      const params = makeStub('params', {
        base: id,
      })

      const tradeInfoResponse = {
        lastPrice: last_price,
        referencePrice: '2',
        priceChange24h: '3',
        tradeVolume24h: '4',
        liquidityBand: 5,
        tradingStatus: trading_status_string,
        statusChangeReason: '6',
        tradingHaltCounter: 7,
      }

      const [tradeInfoPromise, resolveTradeInfo] = deferredPromise<TradeInfoResponse>()

      mockResponse(tradeInfoPromise)

      mockResponse({
        tradingPairId: id,
        buy: [
          {
            orderType: 'LIMIT',
            quantity: bid_volume,
            limit: bid_price,
          },
        ],
        sell: [
          {
            orderType: 'LIMIT',
            quantity: ask_volume,
            limit: ask_price,
          },
        ],
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(params)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveTradeInfo(tradeInfoResponse)

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: last_price,
        data: {
          last_price,
          bid_price,
          bid_volume,
          ask_price,
          ask_volume,
          mid_price,
          market_status: 2,
          trading_status_string,
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
