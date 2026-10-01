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
    API_KEY: 'fake-api-key',
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
  const mockWsServer: MockWebsocketServer[] = []
  let socket: WebSocket
  const wsClose = jest.fn()
  const receivedMessages: { serverIndex: number; message: string }[] = []

  const setUpMockWsServer = (index: number) => {
    mockWsServer[index]?.close()
    mockWsServer[index] = new MockWebsocketServer(
      `${adapterSettings.WS_API_ENDPOINT}/${index}?token=${adapterSettings.API_KEY}`,
      {
        mock: false,
      },
    )

    mockWsServer[index].on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push({
          serverIndex: index,
          message: String(message),
        })
      })
    })
    mockWsServer[index].on('close', () => {
      wsClose()
    })
  }

  beforeAll(() => {
    clock = FakeTimers.install()
  })

  beforeEach(async () => {
    mockWebSocketProvider(WebSocketClassProvider)
    receivedMessages.length = 0
    setUpMockWsServer(0)
    setUpMockWsServer(1)

    jest.resetAllMocks()

    transport = new StockQuotesWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should subscribe to the symbol', async () => {
    const symbol = '700/HKD'

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

    await expect(receivedMessages[0].message).toBe(
      JSON.stringify({
        subscribe: [symbol],
      }),
    )
  })

  it('should write equity response to cache', async () => {
    const symbol = '700/HKD'

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

    const ask_price = 123
    const ask_volume = 45
    const bid_price = 120
    const bid_volume = 50
    const last_price = 122
    const mid_price = (ask_price + bid_price) / 2
    const providerIndicatedTimeUnixMs = 123456789000

    socket.send(
      JSON.stringify({
        type: 'equity',
        ask: String(ask_price),
        askVolume: String(ask_volume),
        bid: String(bid_price),
        bidVolume: String(bid_volume),
        lastTradedPrice: String(last_price),
        mid: String(mid_price),
        symbol,
        timestamp: providerIndicatedTimeUnixMs * 1000,
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: last_price,
          data: {
            ask_price,
            ask_volume,
            bid_price,
            bid_volume,
            last_price,
            mid_price,
            timestamp_iso: new Date(providerIndicatedTimeUnixMs).toISOString(),
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

  it('should write index response to cache', async () => {
    const symbol = 'HSI/INDEX'

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

    const value = 123
    const providerIndicatedTimeUnixMs = 123456789000

    socket.send(
      JSON.stringify({
        type: 'index',
        value: String(value),
        symbol,
        timestamp: providerIndicatedTimeUnixMs * 1000,
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: value,
          data: {
            ask_price: value,
            ask_volume: 0,
            bid_price: value,
            bid_volume: 0,
            last_price: value,
            mid_price: value,
            timestamp_iso: new Date(providerIndicatedTimeUnixMs).toISOString(),
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

  it('should unsubscribe from the last symbol by closing the connection', async () => {
    const symbol = '700/HKD'

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
    expect(wsClose).toHaveBeenCalledTimes(0)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(wsClose).toHaveBeenCalledTimes(1)
    expect(receivedMessages.length).toBe(1)
  })

  it('should subscribe to a second symbol by re-connecting', async () => {
    const symbol1 = '700/HKD'
    const symbol2 = 'HSI/INDEX'

    const params1 = makeStub('params', {
      base: symbol1,
    })
    const params2 = makeStub('params', {
      base: symbol2,
    })

    subscriptionSet.getAll.mockReturnValue([params1])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0].message).toBe(
      JSON.stringify({
        subscribe: [symbol1],
      }),
    )

    subscriptionSet.getAll.mockReturnValue([params1, params2])

    expect(wsClose).toHaveBeenCalledTimes(0)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(wsClose).toHaveBeenCalledTimes(1)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1].message).toBe(
      JSON.stringify({
        subscribe: [symbol1, symbol2],
      }),
    )
  })

  it('should unsubscribe from a second symbol by re-connecting', async () => {
    const symbol1 = '700/HKD'
    const symbol2 = 'HSI/INDEX'

    const params1 = makeStub('params', {
      base: symbol1,
    })
    const params2 = makeStub('params', {
      base: symbol2,
    })

    subscriptionSet.getAll.mockReturnValue([params1, params2])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0].message).toBe(
      JSON.stringify({
        subscribe: [symbol1, symbol2],
      }),
    )

    subscriptionSet.getAll.mockReturnValue([params1])

    expect(wsClose).toHaveBeenCalledTimes(0)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(wsClose).toHaveBeenCalledTimes(1)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1].message).toBe(
      JSON.stringify({
        subscribe: [symbol1],
      }),
    )
  })

  it('should recover from subscribing to an invalid symbol', async () => {
    const validSymbol = '700/HKD'
    const invalidSymbol = 'INVALID/SYMBOL'

    const validParams = makeStub('params', {
      base: validSymbol,
    })
    const invalidParams = makeStub('params', {
      base: invalidSymbol,
    })

    subscriptionSet.getAll.mockReturnValue([validParams, invalidParams])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0].message).toBe(
      JSON.stringify({
        subscribe: [validSymbol, invalidSymbol],
      }),
    )

    expect(wsClose).toHaveBeenCalledTimes(0)
    socket.send(
      JSON.stringify({
        error: `invalid symbols: ${invalidSymbol}`,
      }),
    )

    expect(wsClose).toHaveBeenCalledTimes(0)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(wsClose).toHaveBeenCalledTimes(1)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1].message).toBe(
      JSON.stringify({
        subscribe: [validSymbol],
      }),
    )

    expect(log).toHaveBeenCalledWith(
      `Received error message from provider: invalid symbols: ${invalidSymbol}`,
    )
    expect(log).toHaveBeenCalledWith(
      `Invalid symbols: ${invalidSymbol}. They will be ignored in future requests. Reconnecting.`,
    )
    log.mockClear()
  })

  it('should reconnect to a different server after unexpected close', async () => {
    const symbol = '700/HKD'

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

    await expect(receivedMessages[0]).toEqual({
      serverIndex: 0,
      message: JSON.stringify({
        subscribe: [symbol],
      }),
    })

    const abnormalClosureCode = 1006
    mockWsServer[0].close({ code: abnormalClosureCode, reason: 'none', wasClean: false })
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1]).toEqual({
      serverIndex: 1,
      message: JSON.stringify({
        subscribe: [symbol],
      }),
    })

    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(
      `WebSocket closed abnormally (code: ${abnormalClosureCode}, reason: none). Failover counter incremented to 1. URL: ws://api.example.com/0`,
    )
    log.mockClear()
  })
})
