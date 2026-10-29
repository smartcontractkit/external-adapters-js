import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  WebSocket,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  ProviderResult,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
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

type DxLinkTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: typeof config.settings
}

type WithProvider<T> = T & { Provider: { WsMessage: DxLinkMessage } }

/**
 * Builds a WebSocketTransport speaking the dxLink protocol: it subscribes every
 * requested `base` to `eventTypes`, and hands each decoded event to `parseEvent`.
 */
export const buildDxLinkTransport = <T extends DxLinkTransportTypes>({
  eventTypes,
  parseEvent,
}: {
  eventTypes: DxLinkEventType[]
  parseEvent: (event: DxLinkEvent) => ProviderResult<WithProvider<T>>[]
}): WebSocketTransport<WithProvider<T>> => {
  // Field order of COMPACT records, as announced by the server in FEED_CONFIG
  const fieldsByEventType = new Map<string, string[]>()
  let connection: WebSocket | undefined

  const storeFeedConfig = (message: DxLinkMessage) => {
    for (const [eventType, fields] of Object.entries(message.eventFields ?? {})) {
      if (Array.isArray(fields) && fields.length > 0) {
        fieldsByEventType.set(eventType, fields)
      }
    }
  }

  const decodeFeedData = (data: unknown[] = []): DxLinkEvent[] =>
    splitArrayIntoChunks(data, 2).flatMap(([eventType, values]) => {
      const fields = fieldsByEventType.get(eventType as string)
      if (!fields || !Array.isArray(values)) {
        logger.warn(`Dropping ${eventType} data: field layout unknown (no FEED_CONFIG yet)`)
        return []
      }
      return splitArrayIntoChunks(values, fields.length)
        .filter((record) => record.length === fields.length)
        .map((record) => Object.fromEntries(fields.map((f, i) => [f, stripNul(record[i])])))
    }) as DxLinkEvent[]

  // Every dxfeed endpoint has a `base` param, which TS can't see through the generic params type
  const toSubscriptions = (params: object) =>
    eventTypes.map((type) => ({ type, symbol: (params as { base: string }).base.toUpperCase() }))

  return new WebSocketTransport<WithProvider<T>>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    // dxFeed authenticates the WS upgrade with HTTP Basic, so dxLink's AUTH message is not used
    options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => ({
      headers: {
        Authorization: `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')}`,
      },
    }),

    handlers: {
      // The connection is ready once the server answers FEED_SETUP with FEED_CONFIG
      open: (ws) => {
        connection = ws
        return new Promise((resolve, reject) => {
          ws.addEventListener('message', (event: WebSocket.MessageEvent) => {
            try {
              const message: DxLinkMessage = JSON.parse(event.data.toString())
              if (message.type === 'FEED_CONFIG') {
                storeFeedConfig(message)
                resolve()
              } else if (message.type === 'ERROR') {
                reject(new Error(`dxLink handshake failed: ${message.error} ${message.message}`))
              }
            } catch (error) {
              reject(error)
            }
          })
          ws.send(
            JSON.stringify({
              type: 'SETUP',
              channel: CONTROL_CHANNEL,
              version: '0.1-js/1.0.0',
              keepaliveTimeout: 60,
              acceptKeepaliveTimeout: 60,
            }),
          )
          ws.send(
            JSON.stringify({
              type: 'CHANNEL_REQUEST',
              channel: FEED_CHANNEL,
              service: 'FEED',
              parameters: { contract: 'AUTO' },
            }),
          )
          ws.send(
            JSON.stringify({
              type: 'FEED_SETUP',
              channel: FEED_CHANNEL,
              acceptAggregationPeriod: 1,
              acceptDataFormat: 'COMPACT',
              acceptEventFields: Object.fromEntries(eventTypes.map((t) => [t, EVENT_FIELDS[t]])),
            }),
          )
        })
      },

      message: (message) => {
        switch (message.type) {
          case 'FEED_DATA':
            return decodeFeedData(message.data)
              .filter((event) => eventTypes.includes(event.eventType))
              .flatMap(parseEvent)
          case 'FEED_CONFIG':
            storeFeedConfig(message)
            return []
          case 'CHANNEL_CLOSED':
            // Closing the socket makes the framework reconnect, redo the handshake and resubscribe
            logger.info(`dxLink closed channel ${message.channel}, reconnecting`)
            connection?.close()
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
      },

      heartbeat: (ws) => {
        ws.send(JSON.stringify({ type: 'KEEPALIVE', channel: CONTROL_CHANNEL }))
      },
    },

    builders: {
      // Requests that differ only in other params (e.g. stock_quotes' isOvernight) share one
      // dxLink subscription, so dedupe them and never remove one that is still desired.
      customSubscriptionMessages: (_context, { new: added, stale, desired }) => {
        const key = ({ type, symbol }: { type: string; symbol: string }) => `${type}:${symbol}`
        const stillDesired = new Set(desired.flatMap(toSubscriptions).map(key))
        const add = uniqueBy(added.flatMap(toSubscriptions), key)
        const remove = uniqueBy(stale.flatMap(toSubscriptions), key).filter(
          (sub) => !stillDesired.has(key(sub)),
        )
        if (add.length === 0 && remove.length === 0) {
          return []
        }
        return [{ type: 'FEED_SUBSCRIPTION', channel: FEED_CHANNEL, add, remove }]
      },
    },
  })
}

const uniqueBy = <V>(values: V[], key: (value: V) => string): V[] => [
  ...new Map(values.map((value) => [key(value), value])).values(),
]

const stripNul = (value: unknown) =>
  typeof value === 'string' ? value.split('\u0000').join('') : value
