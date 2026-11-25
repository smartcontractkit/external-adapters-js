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
import { BaseEndpointTypes } from '../../src/endpoint/markprice'
import { MarkPriceSocketTransport, WsTransportTypes } from '../../src/transport/markprice'

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

describe('markprice', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'markprice'
  const venue = 'binance'

  // Trailing slash is intentional: the transport must trim it when building the URL
  const adapterSettings = makeStub('adapterSettings', {
    WS_API_ENDPOINT: 'wss://data.lo.tech/ws/v1/',
    FUTURES_API_KEY: 'test-api-key',
    WS_SUBSCRIPTION_TTL: 30_000,
    WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 120_001,
    STREAM_HANDLER_RETRY_MIN_MS: 101,
    STREAM_HANDLER_RETRY_EXP_FACTOR: 3,
    STREAM_HANDLER_RETRY_MAX_MS: 1_200_001,
    MAX_COMMON_KEY_SIZE: 300,
    WS_CONNECTION_OPEN_TIMEOUT: 10_001,
    BACKGROUND_EXECUTE_MS_WS: 1_002,
    WS_HEARTBEAT_INTERVAL_MS: 30_000,
    MAX_WS_CONNECTION_AGE_SECONDS: 3_600,
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

  let transport: MarkPriceSocketTransport

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
    // Server only exists at this URL if the transport appends the venue to the trimmed base URL
    mockWsServer = new MockWebsocketServer(`${adapterSettings.WS_API_ENDPOINT}binance`, {
      mock: false,
    })

    mockWsServer.on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push(String(message))
      })
    })

    transport = new MarkPriceSocketTransport(venue)
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  const makeContext = () =>
    makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

  const makeSubscribedContext = async (symbol: string) => {
    const params = makeStub('params', {
      base: symbol,
      exchange: venue,
    })
    subscriptionSet.getAll.mockReturnValue([params] as never)
    const context = makeContext()
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    return { params, context }
  }

  it('should subscribe to the top of book', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)
    expect(receivedMessages.length).toBe(1)

    expect(receivedMessages[0]).toBe(
      JSON.stringify({
        op: 'SUBSCRIBE',
        topics: [
          {
            symbol,
            type: 'TOP_OF_BOOK',
            freq: 10,
            quote: 'USD',
          },
        ],
      }),
    )
  })

  it('should write response to cache', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    const t0 = Date.now()
    const { params } = await makeSubscribedContext(symbol)
    const t1 = Date.now()

    const bid = 123.5
    const ask = 130.25
    const mid = (bid + ask) / 2
    const providerIndicatedTimeUnixMs = 123456789

    socket.send(
      JSON.stringify({
        egress_ts: providerIndicatedTimeUnixMs * 1000,
        data: {
          type: 'TOP_OF_BOOK',
          symbol,
          bid_price: String(bid),
          ask_price: String(ask),
        },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: null,
          data: {
            mid,
            ask,
            bid,
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

  it('should accept numeric bid/ask/egress_ts', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    const t0 = Date.now()
    const { params } = await makeSubscribedContext(symbol)
    const t1 = Date.now()

    socket.send(
      JSON.stringify({
        egress_ts: 123456789000,
        data: {
          type: 'TOP_OF_BOOK',
          symbol,
          bid_price: 100,
          ask_price: 101,
        },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: null,
          data: {
            mid: 100.5,
            ask: 101,
            bid: 100,
          },
          timestamps: {
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
            providerIndicatedTimeUnixMs: 123456789,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)
    expect(receivedMessages.length).toBe(1)

    subscriptionSet.getAll.mockReturnValue([] as never)
    await runAllUntilSettled(clock, transport.backgroundExecute(makeContext()))
    expect(receivedMessages.length).toBe(2)

    expect(receivedMessages[1]).toBe(
      JSON.stringify({
        op: 'UNSUBSCRIBE',
        topics: [
          {
            symbol,
            type: 'TOP_OF_BOOK',
            freq: 10,
            quote: 'USD',
          },
        ],
      }),
    )
  })

  it('should send keep-alive ping', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)
    expect(receivedMessages.length).toBe(1)

    clock.tick(adapterSettings.WS_HEARTBEAT_INTERVAL_MS)
    expect(receivedMessages.length).toBe(2)
    expect(receivedMessages[1]).toBe(JSON.stringify({ op: 'PING' }))

    clock.tick(adapterSettings.WS_HEARTBEAT_INTERVAL_MS)
    expect(receivedMessages.length).toBe(3)
    expect(receivedMessages[2]).toBe(JSON.stringify({ op: 'PING' }))
  })

  it('should write error to cache', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    const t0 = Date.now()
    await makeSubscribedContext(symbol)
    const t1 = Date.now()

    const message = JSON.stringify({
      error: {
        error: 'Some subscriptions failed',
        code: 14,
        id: null,
        info: {
          type: 'subscription_failure',
          failures: [
            {
              raw: { symbol },
              message: 'invalid_permission',
            },
          ],
          succeeded: [],
        },
      },
    })
    socket.send(message)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params: { base: symbol, exchange: venue },
        response: {
          statusCode: 502,
          errorMessage: 'invalid_permission',
          timestamps: {
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)

    expect(log).toHaveBeenCalledWith(`Received error message on websocket: ${message}`)
    log.mockClear()
  })

  it.each([
    ['non-numeric bid', { bid_price: 'abc', ask_price: '101' }],
    ['non-numeric ask', { bid_price: '100', ask_price: 'abc' }],
    ['empty bid', { bid_price: '', ask_price: '101' }],
    ['negative bid', { bid_price: '-1', ask_price: '101' }],
    ['bid greater than ask', { bid_price: '102', ask_price: '101' }],
  ])('should skip message with %s', async (_name, prices) => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)

    const message = JSON.stringify({
      egress_ts: 123456789000,
      data: {
        type: 'TOP_OF_BOOK',
        symbol,
        ...prices,
      },
    })
    socket.send(message)

    expect(responseCache.write).not.toHaveBeenCalled()
    log.mockClear()
  })

  it('should skip message with invalid egress_ts', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)

    const message = JSON.stringify({
      egress_ts: 0,
      data: {
        type: 'TOP_OF_BOOK',
        symbol,
        bid_price: '100',
        ask_price: '101',
      },
    })
    socket.send(message)

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith(`Invalid ask/bid/egress_ts in: ${message}`)
    log.mockClear()
  })

  it('should log warning for unsupported message type', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)

    const message = JSON.stringify({
      egress_ts: 123456789000,
      data: {
        type: 'TRADE',
        symbol,
      },
    })
    socket.send(message)

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith(`Received unsupported message: ${message}`)
    log.mockClear()
  })

  it('should ignore pong message', async () => {
    const symbol = 'S|NVDA-USDT:PERP:LINEAR'

    await makeSubscribedContext(symbol)

    socket.send(
      JSON.stringify({
        pong: { api_version: '3.0.63' },
      }),
    )

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })
})
