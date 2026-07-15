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
import { isValidTimezone } from '../../src/config'
import { BaseEndpointTypes } from '../../src/endpoint/cme_futures'
import {
  CmeFuturesWebSocketTransport,
  getContractMonthFromSymbol,
  getRollDateTimestampSeconds,
  WsTransportTypes,
} from '../../src/transport/cme_futures'

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

describe('cme_futures', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'cme_futures'

  const adapterSettings = makeStub('adapterSettings', {
    FUTURES_WS_API_ENDPOINT: 'wss://data.lo.tech/ws/v1/rwa',
    FUTURES_API_KEY: 'test-api-key',
    ROLL_DATE_TIMEZONE: 'America/New_York',
    ROLL_DATE_TIME_SECONDS: 0,
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

  let transport: CmeFuturesWebSocketTransport

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
    mockWsServer = new MockWebsocketServer(adapterSettings.FUTURES_WS_API_ENDPOINT!, {
      mock: false,
    })

    mockWsServer.on('connection', (sock) => {
      socket = sock as WebSocket
      sock.on('message', (message) => {
        receivedMessages.push(String(message))
      })
    })

    transport = new CmeFuturesWebSocketTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toHaveBeenCalled()
  })

  it('should subscribe to the price', async () => {
    const symbol = 'WTI/1'

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
    const symbol = 'WTI/1'
    const rollDate = '2026-07-21'

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
          symbol: 'WTIQ6', // Q = August, 6 = 2026
          generic_symbol: symbol,
          spread,
          type: 'PRICE',
          expiry_date: rollDate,
          roll_date: rollDate,
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
            roll_date: new Date(`${rollDate}T00:00:00-04:00`).getTime() / 1000,
            symbol: 'WTIQ6',
            generic_symbol: symbol,
            expiry_date: rollDate,
            contract_month: 8,
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
    const symbol = 'WTI/1'

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
    const symbol = 'WTI/1'

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
    const symbol = 'WTI/1'

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
    const symbol = 'WTI/1'

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
    const symbol = 'WTI/1'

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

  describe('getContractMonthFromSymbol', () => {
    it('should return the correct contract month for a given symbol', () => {
      expect(getContractMonthFromSymbol('WTIF6')).toBe(1)
      expect(getContractMonthFromSymbol('WTIG6')).toBe(2)
      expect(getContractMonthFromSymbol('WTIH6')).toBe(3)
      expect(getContractMonthFromSymbol('WTIJ6')).toBe(4)
      expect(getContractMonthFromSymbol('WTIK6')).toBe(5)
      expect(getContractMonthFromSymbol('WTIM6')).toBe(6)
      expect(getContractMonthFromSymbol('WTIN6')).toBe(7)
      expect(getContractMonthFromSymbol('WTIQ6')).toBe(8)
      expect(getContractMonthFromSymbol('WTIU6')).toBe(9)
      expect(getContractMonthFromSymbol('WTIV6')).toBe(10)
      expect(getContractMonthFromSymbol('WTIX6')).toBe(11)
      expect(getContractMonthFromSymbol('WTIZ6')).toBe(12)
    })

    it('should throw for a too short symbol', () => {
      const symbol = 'Q'
      expect(() => getContractMonthFromSymbol(symbol)).toThrow(
        `Symbol must be at least 2 characters long. Received: '${symbol}'`,
      )
    })

    it('should throw for an invalid month code', () => {
      const symbol = 'WTIA6'
      expect(() => getContractMonthFromSymbol(symbol)).toThrow(
        `Second to last character of symbol must be a valid month code. Received: '${symbol}'`,
      )
    })
  })

  describe('getRollDateTimestampSeconds', () => {
    it('should convert a date string to a unix timestamp in seconds', () => {
      const settings = makeStub('settings', {
        ROLL_DATE_TIMEZONE: 'America/New_York',
        ROLL_DATE_TIME_SECONDS: 0,
      } as unknown as BaseEndpointTypes['Settings'])
      const date = '2026-01-21'
      expect(getRollDateTimestampSeconds(date, settings)).toBe(
        new Date(`${date}T00:00:00-05:00`).getTime() / 1000,
      )
    })

    it('should convert a date string during daylight saving time', () => {
      const settings = makeStub('settings', {
        ROLL_DATE_TIMEZONE: 'America/New_York',
        ROLL_DATE_TIME_SECONDS: 0,
      } as unknown as BaseEndpointTypes['Settings'])
      const date = '2026-07-21'
      expect(getRollDateTimestampSeconds(date, settings)).toBe(
        new Date(`${date}T00:00:00-04:00`).getTime() / 1000,
      )
    })

    it('should convert a date string with time offset', () => {
      const settings = makeStub('settings', {
        ROLL_DATE_TIMEZONE: 'America/New_York',
        ROLL_DATE_TIME_SECONDS: 16 * 3600,
      } as unknown as BaseEndpointTypes['Settings'])
      const date = '2026-01-21'
      expect(getRollDateTimestampSeconds(date, settings)).toBe(
        new Date(`${date}T16:00:00-05:00`).getTime() / 1000,
      )
    })

    it('should convert a date string with different timezone', () => {
      const settings = makeStub('settings', {
        ROLL_DATE_TIMEZONE: 'Europe/Zurich',
        ROLL_DATE_TIME_SECONDS: 0,
      } as unknown as BaseEndpointTypes['Settings'])
      const date = '2026-01-21'
      expect(getRollDateTimestampSeconds(date, settings)).toBe(
        new Date(`${date}T00:00:00+01:00`).getTime() / 1000,
      )
    })

    it('should throw for an invalid date string', () => {
      const settings = makeStub('settings', {
        ROLL_DATE_TIMEZONE: 'Europe/Zurich',
        ROLL_DATE_TIME_SECONDS: 0,
      } as unknown as BaseEndpointTypes['Settings'])
      const date = 'invalid-date'
      expect(() => getRollDateTimestampSeconds(date, settings)).toThrow(
        `Invalid roll date from data provider: '${date}'`,
      )
    })
  })

  describe('isValidTimezone', () => {
    it('should return true for a valid timezone', () => {
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('Europe/Zurich')).toBe(true)
      expect(isValidTimezone('UTC')).toBe(true)
    })

    it('should return false for an invalid timezone', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('')).toBe(false)
      expect(isValidTimezone('America/New_York/Extra')).toBe(false)
    })
  })
})
