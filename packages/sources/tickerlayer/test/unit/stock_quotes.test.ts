import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import {
  TransportDependencies,
  WebSocketClassProvider,
} from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  makeStub,
  mockWebSocketProvider,
  MockWebsocketServer,
  runAllUntilSettled,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { BaseEndpointTypes } from '../../src/endpoint/stock_quotes'
import { StockQuotesWebSocketTransport, WsTransportTypes } from '../../src/transport/stock_quotes'

const stockQuotesAsset = 'stocks'
const stockQuotesChannel = 'stocks.quotes'
const quotesType = 'quote'

const etfQuotesAsset = 'etfs'
const etfQuotesChannel = 'etfs.quotes'

const overnightQuotesChannel = 'overnight.quotes'
const overnightSession = 'overnight'

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

LoggerFactoryProvider.set({ child: () => logger })
metrics.initialize()

describe('StockQuotesWebSocketTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'stock_quotes'

  const adapterSettings = makeStub('adapterSettings', {
    API_KEY: 'test-api-key',
    WS_API_ENDPOINT: 'ws://api.example.com',
    WS_SUBSCRIPTION_TTL: 30_000,
    WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 120_000,
    STREAM_HANDLER_RETRY_MIN_MS: 100,
    STREAM_HANDLER_RETRY_EXP_FACTOR: 3,
    STREAM_HANDLER_RETRY_MAX_MS: 1_200_000,
    MAX_COMMON_KEY_SIZE: 300,
    WS_CONNECTION_OPEN_TIMEOUT: 10_000,
    BACKGROUND_EXECUTE_MS_WS: 1_000,
    WS_HEARTBEAT_INTERVAL_MS: 30_000,
    MAX_WS_CONNECTION_AGE_SECONDS: undefined,
  } as unknown as BaseEndpointTypes['Settings'])

  const subscriptionSet = makeStub('subscriptionSet', {
    getAll: jest.fn(),
  })

  const subscriptionSetFactory = makeStub('subscriptionSetFactory', {
    buildSet() {
      return subscriptionSet
    },
  })

  const responseCache = {
    write: jest.fn(),
  }
  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<WsTransportTypes>)

  let transport: StockQuotesWebSocketTransport

  let clock: FakeTimers.Clock
  let mockWsServer: MockWebsocketServer
  let socket: WebSocket
  const receivedMessages: string[] = []

  beforeAll(() => {
    clock = FakeTimers.install()
  })

  beforeEach(async () => {
    jest.resetAllMocks()

    mockWebSocketProvider(WebSocketClassProvider)
    receivedMessages.length = 0
    mockWsServer?.close()
    mockWsServer = new MockWebsocketServer(adapterSettings.WS_API_ENDPOINT, {
      mock: false,
    })

    mockWsServer.on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push(String(message))
      })
    })

    transport = new StockQuotesWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  const makeParams = (symbol: string, assetType: string, isOvernight = false) => ({
    base: symbol,
    assetType,
    isOvernight,
  })

  const setUpSubscription = async (symbol: string, assetType: string, isOvernight = false) => {
    const params = makeStub('params', makeParams(symbol, assetType, isOvernight))
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
  }

  it('should subscribe to the stock symbol', async () => {
    const symbol = 'US:AAPL'
    await setUpSubscription(symbol, stockQuotesAsset)

    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0]).toBe(
      JSON.stringify({
        action: 'subscribe',
        channels: [stockQuotesChannel],
        symbols: [symbol],
      }),
    )
  })

  it('should subscribe to the etf symbol', async () => {
    const symbol = 'JP:1329'
    await setUpSubscription(symbol, etfQuotesAsset)

    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0]).toBe(
      JSON.stringify({
        action: 'subscribe',
        channels: [etfQuotesChannel],
        symbols: [symbol],
      }),
    )
  })

  it('should subscribe to the overnight channel with full spread', async () => {
    const symbol = 'US:AAPL'
    await setUpSubscription(symbol, stockQuotesAsset, true)

    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0]).toBe(
      JSON.stringify({
        action: 'subscribe',
        channels: [overnightQuotesChannel],
        symbols: [symbol],
        spread: 'full',
      }),
    )
  })

  it('should write response to cache', async () => {
    const symbol = 'US:AAPL'
    const params = makeParams(symbol, stockQuotesAsset)

    const t0 = Date.now()
    await setUpSubscription(symbol, stockQuotesAsset)
    const t1 = Date.now()

    const bid_price = 123
    const ask_price = 124
    const mid_price = 123.5
    const bid_volume = 5
    const ask_volume = 6
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        type: quotesType,
        channel: stockQuotesChannel,
        asset: stockQuotesAsset,
        symbol,
        bid: String(bid_price),
        ask: String(ask_price),
        bid_size: String(bid_volume),
        ask_size: String(ask_volume),
        ts: providerIndicatedTimeUnixMs,
      }),
    )

    const response = {
      result: null,
      data: {
        bid_price,
        ask_price,
        mid_price,
        bid_volume,
        ask_volume,
      },
      timestamps: {
        providerDataStreamEstablishedUnixMs: t0,
        providerDataReceivedUnixMs: t1,
        providerIndicatedTimeUnixMs,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should write response to cache for etfs', async () => {
    const symbol = 'JP:1329'
    const params = makeParams(symbol, etfQuotesAsset)

    const t0 = Date.now()
    await setUpSubscription(symbol, etfQuotesAsset)
    const t1 = Date.now()

    const bid_price = 123
    const ask_price = 124
    const mid_price = 123.5
    const bid_volume = 5
    const ask_volume = 6
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        type: quotesType,
        channel: etfQuotesChannel,
        asset: etfQuotesAsset,
        symbol,
        // ETFs return number instead of string
        bid: Number(bid_price),
        ask: Number(ask_price),
        bid_size: Number(bid_volume),
        ask_size: Number(ask_volume),
        ts: providerIndicatedTimeUnixMs,
      }),
    )

    const response = {
      result: null,
      data: {
        bid_price,
        ask_price,
        mid_price,
        bid_volume,
        ask_volume,
      },
      timestamps: {
        providerDataStreamEstablishedUnixMs: t0,
        providerDataReceivedUnixMs: t1,
        providerIndicatedTimeUnixMs,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should write overnight response to cache using provider mid price', async () => {
    const symbol = 'US:AAPL'
    const params = makeParams(symbol, stockQuotesAsset, true)

    const t0 = Date.now()
    await setUpSubscription(symbol, stockQuotesAsset, true)
    const t1 = Date.now()

    const bid_price = 123
    const ask_price = 124
    const mid_price = 123.4
    const bid_size = 5
    const ask_size = 6
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        type: quotesType,
        channel: overnightQuotesChannel,
        asset: stockQuotesAsset,
        session: overnightSession,
        symbol,
        bid: String(bid_price),
        ask: String(ask_price),
        mid: String(mid_price),
        bid_size: String(bid_size),
        ask_size: String(ask_size),
        ts: providerIndicatedTimeUnixMs,
      }),
    )

    const response = {
      result: null,
      data: {
        bid_price,
        ask_price,
        mid_price,
        // Overnight quotes always report zero volume regardless of provider sizes.
        bid_volume: 0,
        ask_volume: 0,
      },
      timestamps: {
        providerDataStreamEstablishedUnixMs: t0,
        providerDataReceivedUnixMs: t1,
        providerIndicatedTimeUnixMs,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should write overnight response with zero volume when provider ask size is zero', async () => {
    const symbol = 'US:AAPL'
    const params = makeParams(symbol, stockQuotesAsset, true)

    const t0 = Date.now()
    await setUpSubscription(symbol, stockQuotesAsset, true)
    const t1 = Date.now()

    const bid_price = 123
    const ask_price = 124
    const mid_price = 123.5
    const bid_size = 5
    const ask_size = 0
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        type: quotesType,
        channel: overnightQuotesChannel,
        asset: stockQuotesAsset,
        session: overnightSession,
        symbol,
        bid: String(bid_price),
        ask: String(ask_price),
        bid_size: String(bid_size),
        ask_size: String(ask_size),
        ts: providerIndicatedTimeUnixMs,
      }),
    )

    const response = {
      result: null,
      data: {
        bid_price,
        ask_price,
        mid_price,
        bid_volume: 0,
        ask_volume: 0,
      },
      timestamps: {
        providerDataStreamEstablishedUnixMs: t0,
        providerDataReceivedUnixMs: t1,
        providerIndicatedTimeUnixMs,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should ignore system messages', async () => {
    const symbol = 'US:AAPL'

    await setUpSubscription(symbol, stockQuotesAsset)

    const systemMessage = { type: 'system', message: 'connected' }
    socket.send(JSON.stringify(systemMessage))

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(debugLog).toHaveBeenCalledWith({
      msg: 'Ignoring system message',
      ignoredMessage: systemMessage,
    })
  })

  it('should ignore unexpected messages', async () => {
    const symbol = 'US:AAPL'

    await setUpSubscription(symbol, stockQuotesAsset)

    const malformedMessage = {
      type: quotesType,
      channel: stockQuotesChannel,
      asset: stockQuotesAsset,
      symbol,
      price: 'not-a-number',
      size: '3',
      ts: 123456789,
    }
    socket.send(JSON.stringify(malformedMessage))

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith({
      msg: 'Ignoring unexpected message',
      ignoredMessage: malformedMessage,
    })
    log.mockClear()
  })

  it('should ignore non-overnight messages with zero ask volume', async () => {
    const symbol = 'US:AAPL'

    await setUpSubscription(symbol, stockQuotesAsset)

    const zeroAskSizeMessage = {
      type: quotesType,
      channel: stockQuotesChannel,
      asset: stockQuotesAsset,
      symbol,
      bid: '123',
      ask: '124',
      bid_size: '5',
      ask_size: '0',
      ts: 123456789,
    }
    socket.send(JSON.stringify(zeroAskSizeMessage))

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith({
      msg: 'Ignoring unexpected message',
      ignoredMessage: zeroAskSizeMessage,
    })
    log.mockClear()
  })

  it('should unsubscribe', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', makeParams(symbol, stockQuotesAsset))

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    subscriptionSet.getAll.mockReturnValue([params])
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    subscriptionSet.getAll.mockReturnValue([])
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1]).toBe(
      JSON.stringify({
        action: 'unsubscribe',
        channels: [stockQuotesChannel],
        symbols: [symbol],
      }),
    )
  })

  it('should unsubscribe from the overnight channel', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', makeParams(symbol, stockQuotesAsset, true))

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    subscriptionSet.getAll.mockReturnValue([params])
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    subscriptionSet.getAll.mockReturnValue([])
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1]).toBe(
      JSON.stringify({
        action: 'unsubscribe',
        channels: [overnightQuotesChannel],
        symbols: [symbol],
      }),
    )
  })

  describe('shared provider subscription across overnight assetType variants', () => {
    // The overnight channel is the same for every asset type, so overnight params
    // that differ only by assetType share a single provider subscription.
    const symbol = 'US:AAPL'
    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    const overnightSubscribeMessage = JSON.stringify({
      action: 'subscribe',
      channels: [overnightQuotesChannel],
      symbols: [symbol],
      spread: 'full',
    })
    const overnightUnsubscribeMessage = JSON.stringify({
      action: 'unsubscribe',
      channels: [overnightQuotesChannel],
      symbols: [symbol],
    })

    let overnightStocks: ReturnType<typeof makeParams>
    let overnightEtfs: ReturnType<typeof makeParams>

    beforeEach(() => {
      overnightStocks = makeStub('overnightStocks', makeParams(symbol, stockQuotesAsset, true))
      overnightEtfs = makeStub('overnightEtfs', makeParams(symbol, etfQuotesAsset, true))
    })

    it('should subscribe once when both variants are requested together', async () => {
      subscriptionSet.getAll.mockReturnValue([overnightStocks, overnightEtfs])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))

      expect(receivedMessages).toEqual([overnightSubscribeMessage])
    })

    it('should not resubscribe when the second variant is requested later', async () => {
      subscriptionSet.getAll.mockReturnValue([overnightStocks])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([overnightSubscribeMessage])

      subscriptionSet.getAll.mockReturnValue([overnightStocks, overnightEtfs])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([overnightSubscribeMessage])
    })

    it('should only unsubscribe once no variant is desired anymore', async () => {
      subscriptionSet.getAll.mockReturnValue([overnightStocks, overnightEtfs])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([overnightSubscribeMessage])

      // One variant expires while the other still needs the stream.
      subscriptionSet.getAll.mockReturnValue([overnightStocks])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([overnightSubscribeMessage])

      subscriptionSet.getAll.mockReturnValue([])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([overnightSubscribeMessage, overnightUnsubscribeMessage])
    })

    it('should keep regular and overnight subscriptions for a symbol independent', async () => {
      const regular = makeStub('regular', makeParams(symbol, stockQuotesAsset))
      const subscribeMessage = JSON.stringify({
        action: 'subscribe',
        channels: [stockQuotesChannel],
        symbols: [symbol],
      })

      subscriptionSet.getAll.mockReturnValue([regular, overnightStocks])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([subscribeMessage, overnightSubscribeMessage])

      subscriptionSet.getAll.mockReturnValue([regular])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))
      expect(receivedMessages).toEqual([
        subscribeMessage,
        overnightSubscribeMessage,
        overnightUnsubscribeMessage,
      ])
    })
  })
})
