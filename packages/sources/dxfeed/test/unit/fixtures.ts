/** Shared dxLink test doubles for the staged handshake and COMPACT frames. */
import {
  MockWebsocketServer,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

type ServerSocket = Parameters<MockWebsocketServer['on']>[1] extends (socket: infer Socket) => void
  ? Socket
  : never

type Subscription = { type: string; symbol: string }
type ClientMessage = {
  type: string
  channel?: number
  add?: Subscription[]
  remove?: Subscription[]
  acceptEventFields?: Record<string, string[]>
  clientId?: string
}

// Deterministic cache polling for the adapter-under-test (framework env).
process.env.CACHE_POLLING_MAX_RETRIES = '20'
process.env.CACHE_POLLING_SLEEP_MS = '500'

export const QUOTE_FIELDS = [
  'eventType',
  'eventSymbol',
  'eventTime',
  'bidPrice',
  'askPrice',
  'bidSize',
  'askSize',
  'bidExchangeCode',
  'askExchangeCode',
]

export const TRADE_FIELDS = ['eventType', 'eventSymbol', 'eventTime', 'price']

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

export const feedConfigFrame = (eventFields: Record<string, string[]>): object => ({
  type: 'FEED_CONFIG',
  channel: 1,
  aggregationPeriod: 1,
  dataFormat: 'COMPACT',
  eventFields,
})

export const quoteRecord = (
  eventSymbol: string,
  eventTime: number,
  bidPrice: number | string | null,
  askPrice: number | string | null,
  bidSize: number | string | null,
  askSize: number | string | null,
  bidExchangeCode = 'V',
  askExchangeCode = 'V',
): unknown[] => [
  'Quote',
  eventSymbol,
  eventTime,
  bidPrice,
  askPrice,
  bidSize,
  askSize,
  bidExchangeCode,
  askExchangeCode,
]

export const quoteFrame = (...records: unknown[][]): object => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['Quote', records.flat()],
})

export const tradeRecord = (
  eventType: 'Trade' | 'TradeETH',
  eventSymbol: string,
  eventTime: number,
  price: number | string,
): unknown[] => [eventType, eventSymbol, eventTime, price]

export const tradeFrame = (eventType: 'Trade' | 'TradeETH', ...records: unknown[][]): object => ({
  type: 'FEED_DATA',
  channel: 1,
  data: [eventType, records.flat()],
})

/**
 * Scripted dxLink server. It follows the protocol exchange:
 * SETUP -> server SETUP/AUTH_STATE -> CHANNEL_OPENED -> FEED_CONFIG.
 */
export class ScriptedDxLinkServer {
  readonly server: MockWebsocketServer
  readonly clientMessages: ClientMessage[] = []
  readonly invalidSubscriptionMessages: ClientMessage[] = []
  suppressFeedConfig = false
  suppressChannelOpened = false
  failHandshake = false
  private readonly sockets: ServerSocket[] = []
  private readonly feedData = new Map<string, object[]>()

  constructor(readonly url: string) {
    this.server = new MockWebsocketServer(url, { mock: false })
    this.server.on('connection', (socket: ServerSocket) => {
      this.sockets.push(socket)
      socket.on('message', (raw: unknown) => {
        try {
          this.handleClientMessage(socket, JSON.parse(String(raw)) as ClientMessage)
        } catch {
          // ignore malformed client frames
        }
      })
    })
  }

  private handleClientMessage(socket: ServerSocket, message: ClientMessage): void {
    this.clientMessages.push(message)
    switch (message.type) {
      case 'SETUP':
        this.send(socket, {
          type: 'SETUP',
          channel: 0,
          keepaliveTimeout: 60,
          acceptKeepaliveTimeout: 60,
        })
        this.send(socket, { type: 'AUTH_STATE', channel: 0, state: 'AUTHORIZED' })
        return
      case 'CHANNEL_REQUEST':
        if (!this.suppressChannelOpened) {
          this.send(socket, { type: 'CHANNEL_OPENED', channel: 1, service: 'FEED' })
        }
        return
      case 'FEED_SETUP':
        this.handleFeedSetup(socket, message)
        return
      case 'FEED_SUBSCRIPTION':
        this.handleSubscription(socket, message)
    }
  }

  private handleFeedSetup(socket: ServerSocket, message: ClientMessage): void {
    if (this.failHandshake) {
      this.send(socket, { type: 'ERROR', channel: 0, error: 'UNAUTHORIZED', message: 'test' })
      return
    }
    if (!this.suppressFeedConfig) {
      this.send(socket, feedConfigFrame(message.acceptEventFields ?? {}))
    }
  }

  private handleSubscription(socket: ServerSocket, message: ClientMessage): void {
    const add = message.add ?? []
    const remove = message.remove ?? []
    const emptyAdd = 'add' in message && add.length === 0
    const emptyRemove = 'remove' in message && remove.length === 0
    if (emptyAdd || emptyRemove) {
      this.invalidSubscriptionMessages.push(message)
    }
    add.forEach((entry) => {
      const frames = this.feedData.get(`${entry.type}:${entry.symbol}`) ?? []
      frames.forEach((frame) => this.send(socket, frame))
    })
  }

  private send(socket: ServerSocket, frame: object): void {
    try {
      socket.send(JSON.stringify(frame))
    } catch {
      // socket already closed
    }
  }

  setFeedData(eventType: string, symbol: string, frames: object[]): void {
    this.feedData.set(`${eventType}:${symbol}`, frames)
  }

  push(frame: object): void {
    this.sockets.forEach((socket) => this.send(socket, frame))
  }

  closeAll(): void {
    this.sockets.forEach((socket) => socket.close())
  }

  countByType(type: string): number {
    return this.clientMessages.filter((message) => message.type === type).length
  }

  added(): { symbol: string; type: string }[] {
    return this.clientMessages
      .filter((message) => message.type === 'FEED_SUBSCRIPTION')
      .flatMap((message) => message.add ?? [])
  }

  removed(): { symbol: string; type: string }[] {
    return this.clientMessages
      .filter((message) => message.type === 'FEED_SUBSCRIPTION')
      .flatMap((message) => message.remove ?? [])
  }
}

type TestAdapterLike = Pick<TestAdapter, 'request' | 'clock'>

export async function flushFrames(testAdapter: TestAdapterLike, fakeMs = 500): Promise<void> {
  await testAdapter.clock?.tickAsync?.(fakeMs)
}

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
