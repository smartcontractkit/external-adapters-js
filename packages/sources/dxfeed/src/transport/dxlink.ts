import { metrics } from '@chainlink/external-adapter-framework/metrics'
import type { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import type { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  splitArrayIntoChunks,
  type ProviderResult,
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

export interface DxLinkFrame {
  type: string
  channel?: number

  data?: [string, (string | number)[]]

  eventFields?: Record<string, string[]>
  message?: string
}

export type DxLinkSubscription = { symbol: string; type: string }

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

export type DxLinkTransportTypes<T extends BaseTransportTypes> = T & {
  Provider: {
    WsMessage: DxLinkFrame
  }
}

type ParsedEvents = { eventType: string; records: Record<string, unknown>[] }[]

export function buildDxLinkWsTransport<T extends BaseTransportTypes>(endpointConfig: {
  buildSubscriptions: (params: TypeFromDefinition<T['Parameters']>) => DxLinkSubscription[]
  parseFeedData: (
    events: ParsedEvents,
    guard: StaleTGuard,
  ) => ProviderResult<DxLinkTransportTypes<T>>[]
}): WebSocketTransport<DxLinkTransportTypes<T>> {
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
    if (!fields) {
      logger.warn(`No FEED_CONFIG field list for event type ${eventType}; dropping frame`)
      return []
    }
    if (flat.length % fields.length !== 0) {
      logger.warn(
        `Truncating trailing partial ${eventType} record (${flat.length} items is not a multiple of ${fields.length})`,
      )
    }

    const records = splitArrayIntoChunks(flat, fields.length)
      .filter((chunk) => chunk.length === fields.length)
      .map(
        (chunk) =>
          Object.fromEntries(
            fields.map((field, j) => [
              field,
              typeof chunk[j] === 'string' ? stripNullBytes(chunk[j] as string) : chunk[j],
            ]),
          ) as Record<string, unknown>,
      )
    return [{ eventType, records }]
  }

  const guard = new StaleTGuard()

  return new WebSocketTransport<DxLinkTransportTypes<T>>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    options: ({ adapterSettings: { API_USERNAME, API_PASSWORD } }) => {
      const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
      return {
        headers: {
          Authorization: `Basic ${encodedCreds}`,
        },
      }
    },

    handlers: {
      open(connection) {
        guard.reset()
        return new Promise<void>((resolve) => {
          const onMessage = (event: WebSocket.MessageEvent) => {
            let frame: DxLinkFrame
            try {
              frame = JSON.parse(event.data.toString())
            } catch {
              return
            }
            if (frame.type === 'FEED_CONFIG') {
              connection.removeEventListener('message', onMessage)
              onFeedConfig(frame)
              logger.info('dxLink handshake complete: FEED_CONFIG received')
              resolve()
            }
          }

          connection.addEventListener('message', onMessage)

          connection.send(JSON.stringify(SETUP_MESSAGE))
          connection.send(JSON.stringify(CHANNEL_REQUEST_MESSAGE))
          connection.send(JSON.stringify(FEED_SETUP_MESSAGE))
        })
      },

      message(frame): ProviderResult<DxLinkTransportTypes<T>>[] {
        switch (frame.type) {
          case 'FEED_DATA':
            return frame.data ? endpointConfig.parseFeedData(parseFrameData(frame), guard) : []

          case 'FEED_CONFIG':
            onFeedConfig(frame)
            return []
          case 'ERROR':
            logger.warn(`dxLink provider ERROR frame: ${frame.message ?? 'unknown'}`)
            metrics
              .get('wsConnectionErrors')
              .labels({ message: frame.message ?? 'unknown' })
              .inc()
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
