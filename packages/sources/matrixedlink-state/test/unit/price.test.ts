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
import { BaseEndpointTypes } from '../../src/endpoint/price'
import { PriceWebSocketTransport, WsTransportTypes } from '../../src/transport/price'

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

describe('PriceWebSocketTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'price'

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

  let transport: PriceWebSocketTransport

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

    transport = new PriceWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should subscribe to the currency pair', async () => {
    const from = 'ETH'
    const to = 'USD'

    const params = makeStub('params', {
      base: from,
      quote: to,
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
        type: 'subscribe',
        base: from,
        quote: to,
      }),
    )
  })

  it('should write response to cache', async () => {
    const from = 'ETH'
    const to = 'USD'

    const params = makeStub('params', {
      base: from,
      quote: to,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    const t0 = Date.now()
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    const t1 = Date.now()

    const price = 123
    const providerIndicatedTimeUnixMs = 123456789000

    socket.send(
      JSON.stringify({
        type: 'aggregated_price_update',
        timestamp: new Date(providerIndicatedTimeUnixMs).toISOString(),
        data: {
          base: from,
          quote: to,
          price,
        },
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          result: price,
          data: {
            result: price,
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

  it('should write an error response to cache', async () => {
    const from = 'FOO'
    const to = 'BAR'

    const params = makeStub('params', {
      base: from,
      quote: to,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    const t0 = Date.now()
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
    const t1 = Date.now()

    const errorMessage = 'Pair FOO/BAR is not allowed for this API key.'

    socket.send(
      JSON.stringify({
        type: 'error',
        code: 'PAIR_NOT_ALLOWED',
        base: from,
        quote: to,
        message: errorMessage,
      }),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: {
          statusCode: 502,
          errorMessage,
          timestamps: {
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
          },
        },
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should respond to ping', async () => {
    expect(receivedMessages).toEqual([])

    socket.send(
      JSON.stringify({
        type: 'ping',
      }),
    )

    subscriptionSet.getAll.mockReturnValue([])
    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))

    expect(receivedMessages).toEqual([
      JSON.stringify({
        type: 'pong',
      }),
    ])
  })

  it('should unsubscribe', async () => {
    const from = 'ETH'
    const to = 'USD'

    const params = makeStub('params', {
      base: from,
      quote: to,
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
        type: 'unsubscribe',
        base: from,
        quote: to,
      }),
    )
  })
})
