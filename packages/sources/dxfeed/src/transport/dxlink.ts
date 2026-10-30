import { metrics } from '@chainlink/external-adapter-framework/metrics'
import type { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import type { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  type ProviderResult,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import type { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import type { config } from '../config'
import { StaleTGuard, stripNullBytes } from './utils'

const logger = makeLogger('DxLinkWebsocket')

const CONTROL_CHANNEL = 0
const FEED_CHANNEL = 1

export const QUOTE_EVENT_TYPE = 'Quote'
export const TRADE_EVENT_TYPE = 'Trade'
export const TRADE_ETH_EVENT_TYPE = 'TradeETH'

export const QUOTE_EVENT_FIELDS = [
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

export const TRADE_EVENT_FIELDS = [
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

const SETUP_MESSAGE = {
  type: 'SETUP',
  channel: CONTROL_CHANNEL,
  keepaliveTimeout: 60,
  acceptKeepaliveTimeout: 60,
  version: '0.1-js/1.0.0',
}

const CHANNEL_REQUEST_MESSAGE = {
  type: 'CHANNEL_REQUEST',
  channel: FEED_CHANNEL,
  service: 'FEED',
  parameters: { contract: 'AUTO' },
}

const FEED_SETUP_MESSAGE = {
  type: 'FEED_SETUP',
  channel: FEED_CHANNEL,
  acceptAggregationPeriod: 1,
  acceptDataFormat: 'COMPACT',
  acceptEventFields: {
    [QUOTE_EVENT_TYPE]: QUOTE_EVENT_FIELDS,
    [TRADE_EVENT_TYPE]: TRADE_EVENT_FIELDS,
    [TRADE_ETH_EVENT_TYPE]: TRADE_EVENT_FIELDS,
  },
}

const KEEPALIVE_MESSAGE = { type: 'KEEPALIVE', channel: CONTROL_CHANNEL }

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

export type DxLinkSubscription = { symbol: string; type: string }

export type DxLinkBuildSubscriptions<T extends BaseTransportTypes> = (
  params: TypeFromDefinition<T['Parameters']>,
) => DxLinkSubscription[]

type ParsedEvents = { eventType: string; records: Record<string, unknown>[] }[]

export interface DxLinkFrame {
  type: string
  channel?: number
  data?: [string, (string | number)[]]
  eventFields?: Record<string, string[]>
  message?: string
}

export type DxLinkTransportTypes<T extends BaseTransportTypes> = T & {
  Provider: {
    WsMessage: DxLinkFrame
  }
}

export type DxLinkParseFeedData<T extends BaseTransportTypes> = (
  events: ParsedEvents,
  guard: StaleTGuard,
) => ProviderResult<DxLinkTransportTypes<T>>[]

export interface DxLinkEndpointConfig<T extends BaseTransportTypes> {
  buildSubscriptions: DxLinkBuildSubscriptions<T>
  parseFeedData: DxLinkParseFeedData<T>
}

/** Positional COMPACT values -> named record, stripping NUL bytes from strings. */
const toRecord = (fields: string[], chunk: (string | number)[]): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field, j) => [
      field,
      typeof chunk[j] === 'string' ? stripNullBytes(chunk[j] as string) : chunk[j],
    ]),
  )

export function buildDxLinkWsTransport<T extends BaseTransportTypes>(
  endpointConfig: DxLinkEndpointConfig<T>,
): WebSocketTransport<DxLinkTransportTypes<T>> {
  const eventFields = new Map<string, string[]>()

  const onFeedConfig = (frame: DxLinkFrame): void => {
    for (const [eventType, fields] of Object.entries(frame.eventFields ?? {})) {
      eventFields.set(eventType, fields)
    }
  }

  const parseFrameData = (frame: DxLinkFrame): ParsedEvents => {
    const [eventType, flat] = frame.data ?? []
    if (!eventType || !Array.isArray(flat)) {
      return []
    }
    const fields = eventFields.get(eventType)
    // An empty list would reach splitArrayIntoChunks(flat, 0), which recurses
    // forever; a non-list value would throw in fields.map. Drop either like a
    // missing list.
    if (!Array.isArray(fields) || !fields.length) {
      logger.warn(`No FEED_CONFIG field list for event type ${eventType}; dropping frame`)
      return []
    }

    const chunks = splitArrayIntoChunks(flat, fields.length)
    const complete = chunks.filter((chunk) => chunk.length === fields.length)
    if (complete.length < chunks.length) {
      logger.warn(
        `Dropping ${chunks.length - complete.length} partial trailing ${eventType} record(s)`,
      )
    }
    return [{ eventType, records: complete.map((chunk) => toRecord(fields, chunk)) }]
  }

  const guard = new StaleTGuard()
  let feedConnection: WebSocket | undefined

  /** dxLink handshake: SETUP -> CHANNEL_REQUEST -> FEED_SETUP, then wait for
   *  FEED_CONFIG (the requirement's completion signal) before subscribing.
   *  The framework's open budget owns the failure case. */
  const handshake = (connection: WebSocket): Promise<void> =>
    new Promise<void>((resolve) => {
      const onMessage = (event: WebSocket.MessageEvent) => {
        let frame: DxLinkFrame
        try {
          frame = JSON.parse(event.data.toString())
        } catch {
          return
        }
        if (frame.type !== 'FEED_CONFIG') {
          return
        }
        connection.removeEventListener('message', onMessage)
        onFeedConfig(frame)
        logger.info('dxLink handshake complete: FEED_CONFIG received')
        resolve()
      }

      connection.addEventListener('message', onMessage)

      connection.send(JSON.stringify(SETUP_MESSAGE))
      connection.send(JSON.stringify(CHANNEL_REQUEST_MESSAGE))
      connection.send(JSON.stringify(FEED_SETUP_MESSAGE))
    })

  const recordProviderError = (frame: DxLinkFrame): void => {
    const message = frame.message ?? 'unknown'
    logger.warn(`dxLink provider ERROR frame: ${message}`)
    metrics.get('wsConnectionErrors').labels({ message }).inc()
  }

  return new WebSocketTransport<DxLinkTransportTypes<T>>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    // FRAMEWORK-EXCEPTION: basic-auth-not-oauth
    // dxFeed verifies HTTP Basic on the WS handshake; dxLink's AUTH message is
    // not used. The framework exposes this options() seam for connection
    // headers but has no Basic-auth builder.
    options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => {
      const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
      return {
        headers: {
          Authorization: `Basic ${encodedCreds}`,
        },
      }
    },

    // FRAMEWORK-EXCEPTION: dxlink-control-protocol
    // The dxLink frame vocabulary and handshake sequencing below are
    // provider-specific; WebSocketTransport owns the socket lifecycle,
    // reconnect, heartbeat timer and cache writes.
    handlers: {
      open(connection) {
        feedConnection = connection
        guard.reset()
        return handshake(connection)
      },

      message(frame): ProviderResult<DxLinkTransportTypes<T>>[] {
        switch (frame.type) {
          case 'FEED_DATA':
            return endpointConfig.parseFeedData(parseFrameData(frame), guard)
          case 'FEED_CONFIG':
            onFeedConfig(frame)
            return []
          case 'CHANNEL_CLOSED':
            // FRAMEWORK-EXCEPTION: dxlink-control-protocol
            // The server closed the FEED channel. Close the socket so the
            // framework reconnects, re-runs the handshake and re-sends the
            // desired subscriptions.
            logger.info(`dxLink closed channel ${frame.channel ?? 'unknown'}; reconnecting`)
            feedConnection?.close()
            return []
          case 'ERROR':
            recordProviderError(frame)
            return []
          default:
            return []
        }
      },

      heartbeat(connection) {
        connection.send(JSON.stringify(KEEPALIVE_MESSAGE))
      },
    },

    builders: {
      customSubscriptionMessages: (_context, subscriptions) => {
        const dedupe = (entries: DxLinkSubscription[]): DxLinkSubscription[] => [
          ...new Map(entries.map((e) => [`${e.symbol}|${e.type}`, e])).values(),
        ]
        const add = dedupe(subscriptions.new.flatMap(endpointConfig.buildSubscriptions))
        const remove = dedupe(subscriptions.stale.flatMap(endpointConfig.buildSubscriptions))
        if (!add.length && !remove.length) {
          return []
        }
        return [
          {
            type: 'FEED_SUBSCRIPTION',
            channel: FEED_CHANNEL,
            add,
            remove,
          },
        ]
      },
    },
  })
}
