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

const CONTROL_CHANNEL = 0
const FEED_CHANNEL = 1

const TIMEOUT_ERROR = 'TIMEOUT'

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

export type DxLinkEvent = {
  eventType: DxLinkEventType
  eventSymbol: string
  [field: string]: unknown
}

type DxLinkMessage = {
  type: string
  channel: number
  eventFields?: Record<string, string[]>
  data?: unknown[]
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

export abstract class DxLinkTransport<T extends BaseTransportTypes> extends WebSocketTransport<
  DxLinkTransportTypes<T>
> {
  private fieldsByEventType = new Map<string, string[]>()
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

  // The connection is ready once FEED_SETUP is answered with FEED_CONFIG
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
        // Provider ERRORs are informational; count them by dxLink error code for alerting.
        metrics
          .get('wsConnectionErrors')
          .labels({ message: message.error ?? 'unknown' })
          .inc()
        // Only TIMEOUT means the connection is unusable; other errors do not stop data.
        if (message.error === TIMEOUT_ERROR) {
          logger.info('dxLink TIMEOUT; reconnecting')
          this.wsConnection?.close()
        }
        return []
      default:
        return []
    }
  }

  // Newest provider time wins. This runs before the cache write and is synchronous,
  // so same-tick frames cannot race. CompareResponseCache is not a substitute: it
  // reads each key asynchronously. Errors bypass this and cannot replace a valid cache.
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

  // Shared subscription: never remove a symbol another request still wants.
  private subscriptionMessages({
    new: added,
    stale,
    desired,
  }: SubscriptionDeltas<TypeFromDefinition<T['Parameters']>>) {
    const desiredSymbols = toSymbols(desired)
    const add = [...toSymbols(added)]
    const remove = [...toSymbols(stale)].filter((symbol) => !desiredSymbols.has(symbol))
    if (add.length === 0 && remove.length === 0) {
      return []
    }
    return [
      {
        type: 'FEED_SUBSCRIPTION',
        channel: FEED_CHANNEL,
        add: this.toSubscriptions(add),
        remove: this.toSubscriptions(remove),
      },
    ]
  }

  protected eventTypesForSymbol(_symbol: string): DxLinkEventType[] {
    return this.eventTypes
  }

  private toSubscriptions(symbols: string[]) {
    return symbols.flatMap((symbol) =>
      this.eventTypesForSymbol(symbol).map((type) => ({ type, symbol })),
    )
  }

  private storeFeedConfig(message: DxLinkMessage) {
    for (const [eventType, fields] of Object.entries(message.eventFields ?? {})) {
      if (Array.isArray(fields) && fields.length > 0) {
        this.fieldsByEventType.set(eventType, fields)
      }
    }
  }

  private decodeFeedData(data: unknown = []): DxLinkEvent[] {
    if (!Array.isArray(data)) {
      logger.warn('Dropping FEED_DATA: data is not an array')
      return []
    }
    return splitArrayIntoChunks(data, 2).flatMap(([eventType, values]) => {
      const fields = this.fieldsByEventType.get(eventType as string)
      if (!fields || !Array.isArray(values)) {
        logger.warn(`Dropping ${eventType} data: field layout unknown (no FEED_CONFIG yet)`)
        return []
      }
      return splitArrayIntoChunks(values, fields.length)
        .filter((record) => record.length === fields.length)
        .map((record) => Object.fromEntries(fields.map((f, i) => [f, stripNul(record[i])])))
        .filter((record) => {
          const symbol = record.eventSymbol
          if (typeof symbol === 'string' && symbol.trim().length > 0) {
            return true
          }
          logger.warn(`Dropping ${String(eventType)} record without a symbol`)
          return false
        })
    }) as DxLinkEvent[]
  }
}

const toSymbols = (params: object[]): Set<string> =>
  new Set(params.map((p) => (p as { base: string }).base.toUpperCase()))

const stripNul = (value: unknown) =>
  typeof value === 'string' ? value.split('\u0000').join('') : value
