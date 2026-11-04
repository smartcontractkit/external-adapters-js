/** Shared dxLink test doubles, derived from the requirement doc and dxLink protocol. */
import {
  MockWebsocketServer,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

// Deterministic cache polling for the adapter-under-test (framework env).
process.env.CACHE_POLLING_MAX_RETRIES = '20'
process.env.CACHE_POLLING_SLEEP_MS = '500'

/** Set the env the dxLink adapter-under-test reads, with the fast test timers. */
export const setDxLinkTestEnv = (url: string, overrides: Record<string, string> = {}): void => {
  Object.assign(process.env, {
    WS_API_ENDPOINT: url,
    API_USERNAME: 'fake-user',
    API_PASSWORD: 'fake-pass',
    WS_SUBSCRIPTION_TTL: '60000',
    WS_SUBSCRIPTION_UNRESPONSIVE_TTL: '60000',
    CACHE_MAX_AGE: '60000',
    WS_CONNECTION_OPEN_TIMEOUT: '2000',
    WS_HEARTBEAT_INTERVAL_MS: '5000',
    ...overrides,
  })
}

export const QUOTE_FIELDS = [
  'eventType',
  'eventSymbol',
  'time',
  'bidPrice',
  'askPrice',
  'bidSize',
  'askSize',
  'bidExchangeCode',
  'askExchangeCode',
]

export const TRADE_FIELDS = [
  'eventType',
  'eventSymbol',
  'time',
  'price',
  'size',
  'sequence',
  'exchangeCode',
  'change',
  'dayVolume',
  'dayTurnover',
  'tickDirection',
  'extendedTradingHours',
]

export const feedConfigFrame = (): object => ({
  type: 'FEED_CONFIG',
  channel: 1,
  eventFields: {
    Quote: [...QUOTE_FIELDS],
    Trade: [...TRADE_FIELDS],
    TradeETH: [...TRADE_FIELDS],
  },
})

export const errorFrame = { type: 'ERROR', channel: 1, message: 'provider error (test)' }
export const keepaliveFrame = { type: 'KEEPALIVE', channel: 0 }

/** One COMPACT Quote record (FEED_CONFIG field order). */
export const quoteRecord = (
  eventSymbol: string,
  time: number,
  bidPrice: number | string | null,
  askPrice: number | string | null,
  bidSize: number | string | null,
  askSize: number | string | null,
  bidExchangeCode = 'V',
  askExchangeCode = 'V',
): unknown[] => [
  'Quote',
  eventSymbol,
  time,
  bidPrice,
  askPrice,
  bidSize,
  askSize,
  bidExchangeCode,
  askExchangeCode,
]

/** COMPACT FEED_DATA frame: outer event tag + flattened records. */
export const quoteFrame = (...records: unknown[][]): object => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['Quote', records.flat()],
})

/** One COMPACT Trade/TradeETH record (FEED_CONFIG field order). */
export const tradeRecord = (
  eventType: 'Trade' | 'TradeETH',
  eventSymbol: string,
  time: number,
  price: number | string,
): unknown[] => [
  eventType,
  eventSymbol,
  time,
  price,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
]

export const tradeFrame = (eventType: 'Trade' | 'TradeETH', ...records: unknown[][]): object => ({
  type: 'FEED_DATA',
  channel: 1,
  data: [eventType, records.flat()],
})

/**
 * Scripted dxLink server: answers the adapter's FEED_SETUP handshake with
 * FEED_CONFIG, replays canned COMPACT data frames when the adapter sends a
 * FEED_SUBSCRIPTION add, and records every client message for assertions.
 */
export class ScriptedDxLinkServer {
  readonly server: MockWebsocketServer
  readonly clientMessages: any[] = []
  /** When true the server withholds FEED_CONFIG so the open handshake stalls. */
  suppressFeedConfig = false
  /** When true the server answers FEED_SETUP with an ERROR frame, failing the handshake. */
  failHandshake = false
  private readonly sockets: any[] = []
  private readonly feedData = new Map<string, object[]>()

  constructor(readonly url: string) {
    this.server = new MockWebsocketServer(url, { mock: false })
    this.server.on('connection', (socket: any) => {
      this.sockets.push(socket)
      socket.on('message', (raw: unknown) => {
        let msg: any = null
        try {
          msg = JSON.parse(String(raw))
        } catch {
          return
        }
        this.handleClientMessage(socket, msg)
      })
    })
  }

  private handleClientMessage(socket: any, msg: any): void {
    this.clientMessages.push(msg)
    if (msg.type === 'FEED_SETUP' && this.failHandshake) {
      this.sendTo(socket, { type: 'ERROR', channel: 0, error: 'UNAUTHORIZED', message: 'test' })
      return
    }
    if (msg.type === 'FEED_SETUP' && !this.suppressFeedConfig) {
      this.sendTo(socket, feedConfigFrame())
      return
    }
    if (msg.type === 'FEED_SUBSCRIPTION') {
      for (const entry of msg.add ?? []) {
        const key = `${entry.type}:${entry.symbol}`
        const frames = this.feedData.get(key) ?? []
        for (const frame of frames) {
          this.sendTo(socket, frame)
        }
      }
    }
  }

  private sendTo(socket: any, frame: object): void {
    try {
      socket.send(JSON.stringify(frame))
    } catch {}
  }

  /** Canned data frames replayed when the adapter subscribes (eventType, symbol). */
  setFeedData(eventType: string, symbol: string, frames: object[]): void {
    this.feedData.set(`${eventType}:${symbol}`, frames)
  }

  /** Push a frame to every connected socket at any time. */
  push(frame: object): void {
    for (const socket of this.sockets) {
      this.sendTo(socket, frame)
    }
  }

  /**
   * Server-side close of every open connection (forces a full reconnect).
   * Both endpoint transports hold their own connection, and reconnect
   * assertions must not depend on which connection happens to be newest.
   */
  closeAll(): void {
    for (const socket of this.sockets) {
      try {
        socket.close()
      } catch {}
    }
  }

  countByType(type: string): number {
    return this.clientMessages.filter((m) => m.type === type).length
  }

  added(): { symbol: string; type: string }[] {
    return this.clientMessages
      .filter((m) => m.type === 'FEED_SUBSCRIPTION')
      .flatMap((m) => m.add ?? [])
  }

  removed(): { symbol: string; type: string }[] {
    return this.clientMessages
      .filter((m) => m.type === 'FEED_SUBSCRIPTION')
      .flatMap((m) => m.remove ?? [])
  }
}

/** Fake timers: never await real sleeps; use flushFrames/awaitWs instead. */
type TestAdapterLike = Pick<TestAdapter, 'request' | 'clock'>

/** Drain queued mock-socket events through the installed fake clock. */
export async function flushFrames(testAdapter: TestAdapterLike, fakeMs = 500): Promise<void> {
  await testAdapter.clock?.tickAsync?.(fakeMs)
}

/**
 * Bounded drain: advance the installed fake clock until `predicate()` holds or
 * the fake-ms budget is spent (bounded variant of the framework's runAllUntil,
 * util/testing-utils.js). Returns the final predicate value.
 */
export async function awaitWs(
  testAdapter: TestAdapterLike,
  predicate: () => boolean,
  maxFakeMs = 10000,
): Promise<boolean> {
  const clock = testAdapter.clock
  if (!clock) {
    return predicate()
  }
  const deadline = Number(clock.now) + maxFakeMs
  while (!predicate() && Number(clock.now) < deadline) {
    await clock.tickAsync(Math.min(500, deadline - Number(clock.now)))
  }
  return predicate()
}

/**
 * REST warm-up: drain the installed clock and re-issue until the foreground poll
 * stops returning 504. No real timers; tickAsync always resolves.
 */
export async function restResponse(
  testAdapter: TestAdapterLike,
  params: object,
  maxFakeMs = 10000,
): Promise<any> {
  let response = await testAdapter.request(params)
  const startedAt = Number(testAdapter.clock?.now ?? 0)
  while (
    response.statusCode === 504 &&
    Number(testAdapter.clock?.now ?? 0) - startedAt < maxFakeMs
  ) {
    await flushFrames(testAdapter, 1000)
    response = await testAdapter.request(params)
  }
  return response
}
