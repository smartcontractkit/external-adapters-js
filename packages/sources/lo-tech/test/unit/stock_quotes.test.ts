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
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
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
    WS_API_ENDPOINT: 'wss://data.lo.tech/ws/v1/rwa',
    API_KEY: 'test-api-key',
    WS_SUBSCRIPTION_TTL: 30_000,
    WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 120_001,
    STREAM_HANDLER_RETRY_MIN_MS: 101,
    STREAM_HANDLER_RETRY_EXP_FACTOR: 3,
    STREAM_HANDLER_RETRY_MAX_MS: 1_200_001,
    MAX_COMMON_KEY_SIZE: 300,
    WS_CONNECTION_OPEN_TIMEOUT: 10_001,
    BACKGROUND_EXECUTE_MS_WS: 1_002,
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
    mockWsServer?.stop()
    mockWsServer = new MockWebsocketServer(adapterSettings.WS_API_ENDPOINT, { mock: false })

    mockWsServer.on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push(String(message))
      })
    })

    transport = new StockQuotesWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
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

    socket.send(
      JSON.stringify({
        egress_ts: providerIndicatedTimeUnixMs * 1000,
        data: {
          price: mid_price,
          symbol,
          spread,
          type: 'PRICE',
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
})
