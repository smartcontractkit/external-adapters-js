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
  runAllUntil,
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

const runAllUntilSettled = async (clock: FakeTimers.Clock, promise: Promise<unknown>) => {
  let settled = false
  promise.finally(() => {
    settled = true
  })
  await runAllUntil(clock, () => settled)
  return promise
}

describe('stock_quotes', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'stock_quotes'

  const adapterSettings = makeStub('adapterSettings', {
    REGION_WS_API_ENDPOINT: {
      get() {
        return 'wss://data.lo.tech/ws/v1/rwa'
      },
    },
    REGION_API_KEY: {
      get() {
        return 'test-api-key'
      },
    },
    WS_SUBSCRIPTION_TTL: 30_000,
    WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 120_001,
    STREAM_HANDLER_RETRY_MIN_MS: 101,
    STREAM_HANDLER_RETRY_EXP_FACTOR: 3,
    STREAM_HANDLER_RETRY_MAX_MS: 1_200_001,
    MAX_COMMON_KEY_SIZE: 300,
    WS_CONNECTION_OPEN_TIMEOUT: 10_001,
    BACKGROUND_EXECUTE_MS_WS: 1_002,
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
    mockWsServer?.stop()
    mockWsServer = new MockWebsocketServer(adapterSettings.REGION_WS_API_ENDPOINT.get('asia'), {
      mock: false,
    })

    mockWsServer.on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push(String(message))
      })
    })

    transport = new StockQuotesWebSocketTransport('asia')
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should subscribe to the stock price', async () => {
    const symbol = '9988-HKD:SPOT'

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
        op: 'SUBSCRIBE',
        topics: [
          {
            symbol,
            type: 'PRICE',
          },
        ],
      }),
    )
  })

  it('should write response to cache', async () => {
    const symbol = '9988-HKD:SPOT'

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
    const ask_price = 130
    const mid_price = (bid_price + ask_price) / 2
    const spread = ask_price - bid_price

    const providerIndicatedTimeUnixMs = 123456789
    const ingressTimestamp = providerIndicatedTimeUnixMs - 555

    socket.send(
      JSON.stringify({
        egress_ts: providerIndicatedTimeUnixMs * 1000,
        data: {
          price: mid_price,
          symbol,
          spread,
          type: 'PRICE',
          ingress_ts: ingressTimestamp * 1000,
        },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: null,
          data: {
            mid_price,
            bid_price,
            ask_price,
            bid_volume: 0,
            ask_volume: 0,
            ingress_ts_iso: new Date(ingressTimestamp).toISOString(),
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

  it('should unsubscribe', async () => {
    const symbol = '9988-HKD:SPOT'

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
        op: 'UNSUBSCRIBE',
        topics: [
          {
            symbol,
            type: 'PRICE',
          },
        ],
      }),
    )
  })

  it('should send keep-alive ping', async () => {
    const symbol = '9988-HKD:SPOT'

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

    clock.tick(adapterSettings.WS_HEARTBEAT_INTERVAL_MS)
    expect(receivedMessages.length).toBe(2)

    await expect(receivedMessages[1]).toBe(
      JSON.stringify({
        op: 'PING',
      }),
    )

    clock.tick(adapterSettings.WS_HEARTBEAT_INTERVAL_MS)
    expect(receivedMessages.length).toBe(3)

    await expect(receivedMessages[2]).toBe(
      JSON.stringify({
        op: 'PING',
      }),
    )
  })

  it('should write error to cache', async () => {
    const symbol = '9988-HKD:SPOT'

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

    const providerIndicatedTimeUnixMs = 123456789

    const message = JSON.stringify({
      egress_ts: providerIndicatedTimeUnixMs * 1000,
      error: {
        error: 'Some subscriptions failed',
        code: 14,
        id: null,
        info: {
          type: 'subscription_failure',
          failures: [
            {
              type: 'invalid_permission',
              symbol,
            },
          ],
          succeeded: [],
        },
      },
    })
    socket.send(message)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          errorMessage: 'invalid_permission',
          statusCode: 502,
          timestamps: {
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
            providerIndicatedTimeUnixMs,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)

    expect(log).toHaveBeenCalledWith(`Received error message on websocket: ${message}`)
    log.mockClear()
  })

  it('should log warning for unknown message type', async () => {
    const symbol = '9988-HKD:SPOT'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        egress_ts: providerIndicatedTimeUnixMs * 1000,
        data: {
          trades: [],
          symbol,
          type: 'TRADE',
        },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
    expect(log).toHaveBeenCalledWith(`Received unsupported message type: TRADE`)
    log.mockClear()
  })

  it('should ignore pong message', async () => {
    const symbol = '9988-HKD:SPOT'

    const params = makeStub('params', {
      base: symbol,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        egress_ts: providerIndicatedTimeUnixMs * 1000,
        pong: { api_version: '3.0.63' },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledTimes(0)
    expect(log).toHaveBeenCalledTimes(0)
  })
})
