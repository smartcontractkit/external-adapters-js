import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import {
  WebSocket,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  ProviderResult,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { config } from '../config'

const logger = makeLogger('DxLinkTransport')

// dxLink multiplexes services over channels: 0 is the connection-level control
// channel, and we open a single FEED service on channel 1.
const CONTROL_CHANNEL = 0
const FEED_CHANNEL = 1

const EVENT_FIELDS = {
  Quote: [
    'eventType',
    'eventSymbol',
    'time',
    'bidPrice',
    'askPrice',
    'bidSize',
    'askSize',
    'bidExchangeCode',
    'askExchangeCode',
  ],
  Trade: ['eventType', 'eventSymbol', 'time', 'price'],
  TradeETH: ['eventType', 'eventSymbol', 'time', 'price'],
}

export type DxLinkEventType = keyof typeof EVENT_FIELDS

/**
 * A decoded COMPACT record, keyed by the field names from FEED_CONFIG.
 * Doubles can arrive as numbers, null, or the strings "NaN" / "Infinity".
 */
export type DxLinkEvent = {
  eventType: DxLinkEventType
  eventSymbol: string
  [field: string]: unknown
}

type DxLinkMessage = {
  type: string
  channel: number
  // FEED_CONFIG
  eventFields?: Record<string, string[]>
  // FEED_DATA (COMPACT): [eventType, flatValues, eventType, flatValues, ...]
  data?: unknown[]
  // ERROR
  error?: string
  message?: string
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: typeof config.settings
}

export type DxLinkTransportTypes<T extends BaseTransportTypes> = T & {
  Provider: { WsMessage: DxLinkMessage }
}

/**
 * WebSocketTransport for the dxLink protocol. It subscribes every requested `base` to the
 * subclass' event types, and hands each decoded event to the subclass' `parseEvent`.
 */
export abstract class DxLinkTransport<T extends BaseTransportTypes> extends WebSocketTransport<
  DxLinkTransportTypes<T>
> {
  // Field order of COMPACT records, as announced by the server in FEED_CONFIG
  private fieldsByEventType = new Map<string, string[]>()
  // Latest provider time written per params, to drop events that arrive out of order
  private latestTimes = new Map<string, number>()

  protected abstract parseEvent(event: DxLinkEvent): ProviderResult<DxLinkTransportTypes<T>>[]

  constructor(private readonly eventTypes: DxLinkEventType[]) {
    super({
      url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',
      // dxFeed authenticates the WS upgrade with HTTP Basic, so dxLink's AUTH message is not used
      options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => {
        const credentials = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
        return { headers: { Authorization: `Basic ${credentials}` } }
      },
      handlers: {
        open: (connection) => this.handshake(connection),
        message: (message) => this.handleMessage(message),
        heartbeat: (connection) => {
          connection.send(JSON.stringify({ type: 'KEEPALIVE', channel: CONTROL_CHANNEL }))
        },
      },
      builders: {
        customSubscriptionMessages: (_context, subscriptions) =>
          this.subscriptionMessages(subscriptions),
      },
    })
  }

  // The connection is ready once the server answers FEED_SETUP with FEED_CONFIG
  private handshake(connection: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.addEventListener('message', (event: WebSocket.MessageEvent) => {
        try {
          const message: DxLinkMessage = JSON.parse(event.data.toString())
          if (message.type === 'FEED_CONFIG') {
            this.storeFeedConfig(message)
            resolve()
          } else if (message.type === 'ERROR') {
            reject(new Error(`dxLink handshake failed: ${message.error} ${message.message}`))
          }
        } catch (error) {
          reject(error)
        }
      })
      connection.send(
        JSON.stringify({
          type: 'SETUP',
          channel: CONTROL_CHANNEL,
          version: '0.1-js/1.0.0',
          keepaliveTimeout: 60,
          acceptKeepaliveTimeout: 60,
        }),
      )
      connection.send(
        JSON.stringify({
          type: 'CHANNEL_REQUEST',
          channel: FEED_CHANNEL,
          service: 'FEED',
          parameters: { contract: 'AUTO' },
        }),
      )
      connection.send(
        JSON.stringify({
          type: 'FEED_SETUP',
          channel: FEED_CHANNEL,
          acceptAggregationPeriod: 1,
          acceptDataFormat: 'COMPACT',
          acceptEventFields: Object.fromEntries(this.eventTypes.map((t) => [t, EVENT_FIELDS[t]])),
        }),
      )
    })
  }

  private handleMessage(message: DxLinkMessage): ProviderResult<DxLinkTransportTypes<T>>[] {
    switch (message.type) {
      case 'FEED_DATA':
        return this.decodeFeedData(message.data)
          .filter((event) => this.eventTypes.includes(event.eventType))
          .flatMap((event) => this.parseEvent(event))
          .filter((result) => this.isLatest(result))
      case 'FEED_CONFIG':
        this.storeFeedConfig(message)
        return []
      case 'CHANNEL_CLOSED':
        // Closing the socket makes the framework reconnect, redo the handshake and resubscribe
        logger.info(`dxLink closed channel ${message.channel}, reconnecting`)
        this.wsConnection?.close()
        return []
      case 'ERROR':
        logger.warn(`dxLink error: ${message.error} ${message.message}`)
        metrics
          .get('wsConnectionErrors')
          .labels({ message: message.error ?? 'unknown' })
          .inc()
        return []
      default:
        return []
    }
  }

  // Out-of-order events (and Trade vs TradeETH, which update the same price) must not overwrite
  // newer data. This can't be checked against the response cache: reads are async, so frames
  // arriving together would race. Results without a provider time (errors) always pass.
  private isLatest({ params, response }: ProviderResult<DxLinkTransportTypes<T>>): boolean {
    const time =
      'timestamps' in response ? response.timestamps?.providerIndicatedTimeUnixMs : undefined
    if (time === undefined) {
      return true
    }
    const key = JSON.stringify(params)
    if (time < (this.latestTimes.get(key) ?? -Infinity)) {
      return false
    }
    this.latestTimes.set(key, time)
    return true
  }

  // Requests that differ only in other params (e.g. stock_quotes' isOvernight) share one
  // dxLink subscription, so dedupe them and never remove one that is still desired.
  private subscriptionMessages({
    new: added,
    stale,
    desired,
  }: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>) {
    const stillDesired = new Set(desired.flatMap((p) => this.toSubscriptions(p)).map(key))
    const add = uniqueBy(
      added.flatMap((p) => this.toSubscriptions(p)),
      key,
    )
    const remove = uniqueBy(
      stale.flatMap((p) => this.toSubscriptions(p)),
      key,
    ).filter((sub) => !stillDesired.has(key(sub)))
    if (add.length === 0 && remove.length === 0) {
      return []
    }
    return [{ type: 'FEED_SUBSCRIPTION', channel: FEED_CHANNEL, add, remove }]
  }

  // Every dxfeed endpoint has a `base` param, which TS can't see through the generic params type
  private toSubscriptions(params: object): Subscription[] {
    const symbol = (params as { base: string }).base.toUpperCase()
    return this.eventTypes.map((type) => ({ type, symbol }))
  }

  private storeFeedConfig(message: DxLinkMessage) {
    for (const [eventType, fields] of Object.entries(message.eventFields ?? {})) {
      if (Array.isArray(fields) && fields.length > 0) {
        this.fieldsByEventType.set(eventType, fields)
      }
    }
  }

  private decodeFeedData(data: unknown[] = []): DxLinkEvent[] {
    return splitArrayIntoChunks(data, 2).flatMap(([eventType, values]) => {
      const fields = this.fieldsByEventType.get(eventType as string)
      if (!fields || !Array.isArray(values)) {
        logger.warn(`Dropping ${eventType} data: field layout unknown (no FEED_CONFIG yet)`)
        return []
      }
      return splitArrayIntoChunks(values, fields.length)
        .filter((record) => record.length === fields.length)
        .map((record) => Object.fromEntries(fields.map((f, i) => [f, stripNul(record[i])])))
    }) as DxLinkEvent[]
  }
}

type Subscription = { type: DxLinkEventType; symbol: string }

const key = ({ type, symbol }: Subscription) => `${type}:${symbol}`

const uniqueBy = <V>(values: V[], toKey: (value: V) => string): V[] => [
  ...new Map(values.map((value) => [toKey(value), value])).values(),
]

const stripNul = (value: unknown) =>
  typeof value === 'string' ? value.split('\u0000').join('') : value
