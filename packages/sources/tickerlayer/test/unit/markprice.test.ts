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
import { BaseEndpointTypes } from '../../src/endpoint/markprice'
import { StockWebSocketTransport, WsTransportTypes } from '../../src/transport/markprice'

const markPriceChannel = 'perpetuals.marks'
const topOfBookChannel = 'perpetuals.quotes'
const markPriceType = 'mark_price'
const topOfBookType = 'top_of_book_perps'

const log = jest.fn()
const debugLog = jest.fn()
const traceLog = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: debugLog,
  trace: traceLog,
  msgPrefix: 'mock-logger',
}

LoggerFactoryProvider.set({ child: () => logger })
metrics.initialize()

describe('MarkPriceWebSocketTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'markprice'

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

  let transport: StockWebSocketTransport

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

    transport = new StockWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  const makeParams = (exchange: string, base: string, type: string) => ({
    exchange,
    base,
    type,
  })

  const context = makeStub('context', {
    adapterSettings,
    endpointName,
  } as EndpointContext<WsTransportTypes>)

  const setUpSubscription = async (...params: ReturnType<typeof makeParams>[]) => {
    const stubbed = params.map((p, i) => makeStub(`params${i}`, p))
    subscriptionSet.getAll.mockReturnValue(stubbed)
    await runAllUntilSettled(clock, transport.backgroundExecute(context))
  }

  const sendMessage = (message: Record<string, unknown>) => {
    socket.send(JSON.stringify(message))
  }

  describe('subscriptions', () => {
    it('should subscribe to the mark price channel', async () => {
      await setUpSubscription(makeParams('binance', 'BTCUSDT', markPriceType))

      expect(receivedMessages).toEqual([
        JSON.stringify({
          action: 'subscribe',
          channels: [markPriceChannel],
          symbols: ['BTCUSDT'],
          format: 'normalized',
        }),
      ])
    })

    it('should subscribe to the top of book channel with tick by tick quote mode', async () => {
      await setUpSubscription(makeParams('bybit', 'BTCUSDT', topOfBookType))

      expect(receivedMessages).toEqual([
        JSON.stringify({
          action: 'subscribe',
          channels: [topOfBookChannel],
          symbols: ['BTCUSDT'],
          format: 'normalized',
          quote_mode: 'tick_by_tick',
        }),
      ])
    })

    it('should share one subscription across requests that only differ by exchange', async () => {
      await setUpSubscription(
        makeParams('binance', 'BTCUSDT', markPriceType),
        makeParams('bybit', 'BTCUSDT', markPriceType),
        makeParams('okx', 'BTCUSDT', markPriceType),
      )

      expect(receivedMessages).toEqual([
        JSON.stringify({
          action: 'subscribe',
          channels: [markPriceChannel],
          symbols: ['BTCUSDT'],
          format: 'normalized',
        }),
      ])
    })

    it('should unsubscribe', async () => {
      await setUpSubscription(makeParams('binance', 'BTCUSDT', markPriceType))

      subscriptionSet.getAll.mockReturnValue([])
      await runAllUntilSettled(clock, transport.backgroundExecute(context))

      expect(receivedMessages).toEqual([
        JSON.stringify({
          action: 'subscribe',
          channels: [markPriceChannel],
          symbols: ['BTCUSDT'],
          format: 'normalized',
        }),
        JSON.stringify({
          action: 'unsubscribe',
          channels: [markPriceChannel],
          symbols: ['BTCUSDT'],
        }),
      ])
    })
  })

  describe('message handling', () => {
    const base = 'BTCUSDT'
    const exchange = 'binance'

    const message = (overrides: Record<string, unknown> = {}) => ({
      type: 'mark_price',
      exchange: 'pv_01',
      contract: base,
      channel: markPriceChannel,
      bid: '4999',
      mid: '5000',
      ask: '5001',
      heartbeat_at: '2026-01-01T00:00:00.000Z',
      timestamp: '2026-01-01T00:00:00.000Z',
      ...overrides,
    })

    it('should write response to cache', async () => {
      const params = makeParams(exchange, base, markPriceType)

      const t0 = Date.now()
      await setUpSubscription(params)
      const t1 = Date.now()

      sendMessage(message())

      const response = {
        result: null,
        data: {
          mid: 5000,
          bid: 4999,
          ask: 5001,
        },
        timestamps: {
          providerDataStreamEstablishedUnixMs: t0,
          providerDataReceivedUnixMs: t1,
          providerIndicatedTimeUnixMs: new Date('2026-01-01T00:00:00.000Z').getTime(),
        },
      }

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })

    it('should fall back to the message timestamp when heartbeat_at is invalid', async () => {
      const params = makeParams(exchange, base, markPriceType)

      const t0 = Date.now()
      await setUpSubscription(params)
      const t1 = Date.now()

      sendMessage(message({ heartbeat_at: 'not-a-date' }))

      const response = {
        result: null,
        data: {
          mid: 5000,
          bid: 4999,
          ask: 5001,
        },
        timestamps: {
          providerDataStreamEstablishedUnixMs: t0,
          providerDataReceivedUnixMs: t1,
          providerIndicatedTimeUnixMs: new Date('2026-01-01T00:00:00.000Z').getTime(),
        },
      }

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })

    it('should ignore messages for an unsubscribed contract', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      sendMessage(message({ contract: 'ETHUSDT' }))

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(traceLog).toHaveBeenCalledWith({
        msg: 'Skip unsubscribed message',
        message: message({ contract: 'ETHUSDT' }),
      })
    })

    it('should ignore messages for an unsubscribed channel', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      sendMessage(message({ channel: topOfBookChannel }))

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(traceLog).toHaveBeenCalledWith({
        msg: 'Skip unsubscribed message',
        message: message({ channel: topOfBookChannel }),
      })
    })

    it('should ignore system messages', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      const systemMessage = { type: 'system', message: 'connected' }
      sendMessage(systemMessage)

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(debugLog).toHaveBeenCalledWith({
        msg: 'Ignoring system message',
        message: systemMessage,
      })
    })

    it('should log an error for the quote mode limit system message', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      sendMessage({
        type: 'system',
        code: 'QUOTE_MODE_LIMIT',
        symbols: ['BTCUSDT', 'ETHUSDT'],
      })

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith(
        'More than 2 connections in this account, top_of_book BTCUSDT, ETHUSDT may be delayed or missing',
      )
      log.mockClear()
    })

    it('should log an error and ignore error messages', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      const errorMessage = {
        type: 'error',
        exchange: 'pv_01',
        contract: base,
        channel: markPriceChannel,
        code: 'SOMETHING_WENT_WRONG',
      }
      sendMessage(errorMessage)

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith({ msg: 'Received error message', message: errorMessage })
      log.mockClear()
    })

    it.each<[string, Record<string, unknown>]>([
      ['missing bid', { bid: undefined }],
      ['non-numeric ask', { ask: 'not-a-number' }],
      ['negative mid', { mid: '-1' }],
      ['empty bid', { bid: '' }],
    ])('should ignore messages with an invalid value (%s)', async (_label, overrides) => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      const invalidMessage = message(overrides)
      sendMessage(invalidMessage)

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith(`Invalid ask/bid/mid in: ${JSON.stringify(invalidMessage)}`)
      log.mockClear()
    })

    it.each<[string, Record<string, unknown>]>([
      ['bid above mid', { bid: '5002', mid: '5000' }],
      ['ask below mid', { bid: '4999', mid: '5000', ask: '4999' }],
    ])('should ignore messages where %s', async (_label, overrides) => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      const invalidMessage = message(overrides)
      sendMessage(invalidMessage)

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith(
        `bid > mid or ask < mid in: ${JSON.stringify(invalidMessage)}`,
      )
      log.mockClear()
    })

    it('should ignore messages without a valid heartbeat or timestamp', async () => {
      await setUpSubscription(makeParams(exchange, base, markPriceType))

      const invalidMessage = message({ heartbeat_at: 'not-a-date', timestamp: 'not-a-date' })
      sendMessage(invalidMessage)

      expect(responseCache.write).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith(
        `Invalid heartbeat/timestamp in: ${JSON.stringify(invalidMessage)}`,
      )
      log.mockClear()
    })
  })
})
