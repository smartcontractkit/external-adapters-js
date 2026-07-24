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

  it('should subscribe to the stock symbol', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0]).toBe(
      JSON.stringify({
        action: 'subscribe',
        channels: ['stocks.quotes'],
        symbols: [symbol],
      }),
    )
  })

  it('should write response to cache', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    const t0 = Date.now()
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    const t1 = Date.now()

    const bid_price = 123
    const ask_price = 124
    const mid_price = 123.5
    const bid_volume = 5
    const ask_volume = 6
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        type: 'quote',
        channel: 'stocks.quotes',
        asset: 'stocks',
        symbol,
        bid: String(bid_price),
        ask: String(ask_price),
        bid_size: String(bid_volume),
        ask_size: String(ask_volume),
        ts: providerIndicatedTimeUnixMs,
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
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
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should ignore system messages', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

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

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    const malformedMessage = {
      type: 'quote',
      channel: 'stocks.quotes',
      asset: 'stocks',
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

  it('should ignore messages with zero ask volume', async () => {
    const symbol = 'US:AAPL'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    const zeroAskSizeMessage = {
      type: 'quote',
      channel: 'stocks.quotes',
      asset: 'stocks',
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

    const params = makeStub('params', {
      base: symbol,
    })

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
        channels: ['stocks.quotes'],
        symbols: [symbol],
      }),
    )
  })
})
