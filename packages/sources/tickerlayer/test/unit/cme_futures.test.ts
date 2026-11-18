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

const futuresAsset = 'futures'
const futuresChannel = 'futures.quotes'
const quotesType = 'quote'

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

describe('StockQuotesWebSocketTransport cme_futures', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'cme_futures'

  const adapterSettings = makeStub('adapterSettings', {
    API_KEY: 'test-api-key',
    WS_API_ENDPOINT: 'ws://api.example.com',
    ROLL_DATE_TIMEZONE: 'America/New_York',
    ROLL_DATE_TIME_SECONDS: 0,
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

  const makeParams = (symbol: string) => ({
    base: symbol,
    assetType: futuresAsset,
    isOvernight: false,
  })

  const setUpSubscription = async (symbol: string) => {
    const params = makeStub('params', makeParams(symbol))
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<WsTransportTypes>)

    await runAllUntilSettled(clock, transport.backgroundExecute(context))
  }

  const makeFuturesMessage = (symbol: string, overrides: Record<string, unknown> = {}) => ({
    type: quotesType,
    channel: futuresChannel,
    asset: futuresAsset,
    symbol,
    bid: '5000',
    ask: '5001',
    bid_size: '10',
    ask_size: '11',
    ts: 123456789,
    price: '5000.5',
    last_trade_date: '2026-12-18',
    roll_date: '2026-11-20',
    contract_month: '2026-12',
    trading_day_of_month: 15,
    ...overrides,
  })

  // November and December are EST (-05:00).
  const startOfDaySeconds = (date: string) => new Date(`${date}T00:00:00-05:00`).getTime() / 1000

  it('should subscribe to the futures channel with all rolls', async () => {
    const symbol = 'CME:ES.C1'
    await setUpSubscription(symbol)

    expect(receivedMessages.length).toBe(1)

    await expect(receivedMessages[0]).toBe(
      JSON.stringify({
        action: 'subscribe',
        channels: [futuresChannel],
        symbols: [symbol],
        rolls: ['all'],
        rolls_depth: 3,
      }),
    )
  })

  it('should write futures response to cache', async () => {
    const symbol = 'CME:ES'
    const params = makeParams(symbol)

    const t0 = Date.now()
    await setUpSubscription(symbol)
    const t1 = Date.now()

    socket.send(JSON.stringify(makeFuturesMessage(symbol)))

    const response = {
      result: null,
      data: {
        mid_price: 5000.5,
        bid_price: 5000,
        ask_price: 5001,
        // Futures quotes don't carry volumes.
        bid_volume: 0,
        ask_volume: 0,
        expiry_date: startOfDaySeconds('2026-12-18'),
        roll_date: startOfDaySeconds('2026-11-20'),
        contract_month: 12,
        trading_day_of_month: 15,
        price_goldman_roll: 5000.5,
        price_goldman_continuous_roll: 5000.5,
      },
      timestamps: {
        providerDataStreamEstablishedUnixMs: t0,
        providerDataReceivedUnixMs: t1,
        providerIndicatedTimeUnixMs: 123456789,
      },
    }

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [{ params, response }])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })

  it('should use the provider price over the calculated mid price', async () => {
    const symbol = 'CME:ES'
    const params = makeParams(symbol)

    const t0 = Date.now()
    await setUpSubscription(symbol)
    const t1 = Date.now()

    socket.send(
      JSON.stringify(
        makeFuturesMessage(symbol, {
          bid: '100',
          ask: '102',
          price: '5000.5',
        }),
      ),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expect.objectContaining({
          data: expect.objectContaining({
            mid_price: 5000.5,
            price_goldman_roll: 5000.5,
          }),
          timestamps: expect.objectContaining({
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
          }),
        }),
      },
    ])
  })

  it('should fall back to the calculated mid price when the provider price is missing', async () => {
    const symbol = 'CME:ES'
    const params = makeParams(symbol)

    const t0 = Date.now()
    await setUpSubscription(symbol)
    const t1 = Date.now()

    socket.send(
      JSON.stringify(
        makeFuturesMessage(symbol, {
          bid: '100',
          ask: '102',
          price: undefined,
        }),
      ),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expect.objectContaining({
          data: expect.objectContaining({
            mid_price: 101,
            price_goldman_roll: 101,
            price_goldman_continuous_roll: 101,
          }),
          timestamps: expect.objectContaining({
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
          }),
        }),
      },
    ])
  })

  it('should use roll prices for a C1 symbol', async () => {
    const symbol = 'CME:ES.C1'
    const params = makeParams(symbol)

    const t0 = Date.now()
    await setUpSubscription(symbol)
    const t1 = Date.now()

    socket.send(
      JSON.stringify(
        makeFuturesMessage(symbol, {
          rolls: { r5: { price: '6001' }, r5c: { price: '6002' } },
        }),
      ),
    )

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expect.objectContaining({
          data: expect.objectContaining({
            mid_price: 5000.5,
            price_goldman_roll: 6001,
            price_goldman_continuous_roll: 6002,
          }),
          timestamps: expect.objectContaining({
            providerDataStreamEstablishedUnixMs: t0,
            providerDataReceivedUnixMs: t1,
          }),
        }),
      },
    ])
  })

  it('should ignore a C1 message without roll prices', async () => {
    const symbol = 'CME:ES.C1'

    await setUpSubscription(symbol)

    const message = makeFuturesMessage(symbol)
    socket.send(JSON.stringify(message))

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith({
      msg: 'Ignoring unexpected future message',
      ignoredMessage: message,
    })
    log.mockClear()
  })

  it.each([
    ['an invalid last_trade_date', { last_trade_date: '18/12/2026' }],
    ['a missing last_trade_date', { last_trade_date: undefined }],
    ['an invalid roll_date', { roll_date: '20/11/2026' }],
    ['a missing roll_date', { roll_date: undefined }],
    ['an invalid contract_month', { contract_month: '2026-13' }],
    ['a missing contract_month', { contract_month: undefined }],
    ['an invalid trading_day_of_month', { trading_day_of_month: 32 }],
    ['a missing trading_day_of_month', { trading_day_of_month: undefined }],
  ])('should ignore a futures message with %s', async (_description, overrides) => {
    const symbol = 'CME:ES'

    await setUpSubscription(symbol)

    const message = makeFuturesMessage(symbol, overrides)
    socket.send(JSON.stringify(message))

    expect(responseCache.write).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith({
      msg: 'Ignoring unexpected future message',
      ignoredMessage: message,
    })
    log.mockClear()
  })

  it('should unsubscribe from the futures channel', async () => {
    const symbol = 'CME:ES.C1'

    const params = makeStub('params', makeParams(symbol))

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
        channels: [futuresChannel],
        symbols: [symbol],
      }),
    )
  })
})
