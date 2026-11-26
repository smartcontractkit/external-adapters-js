import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/markprice'
import { buildSubscriptionMessages, toNumber } from './util'

export const EXCHANGE_TO_DP = {
  binance: 'pv_01',
  bybit: 'pv_02',
  okx: 'pv_03',
  hyperliquid: 'pv_04',
  aster: 'pv_05',
  lighter: 'pv_06',
}

export const TYPE_TO_CHANNEL = {
  top_of_book_perps: 'perpetuals.quotes',
  mark_price: 'perpetuals.marks',
}

export interface WSResponse {
  type: string
  exchange: string
  contract: string
  channel: string
  bid: string
  mid: string
  ask: string
  heartbeat_at: string // ISO 8601 timestamp
  timestamp: string // ISO 8601 timestamp
  code?: string
  symbols?: string[]
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const logger = makeLogger('MarkPriceTransport')

export class StockWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  private subscriptions = new Map<string, TypeFromDefinition<BaseEndpointTypes['Parameters']>>()

  constructor() {
    super({
      url: (context) =>
        `${context.adapterSettings.WS_API_ENDPOINT}?apiKey=${context.adapterSettings.API_KEY}`,
      handlers: {
        heartbeat(connection) {
          connection.send(JSON.stringify({ action: 'ping' }))
        },
        message: (message) => {
          if (message.type === 'system') {
            if (message.code === 'QUOTE_MODE_LIMIT') {
              const symbols = message.symbols?.join(', ') || ''
              logger.error(
                `More than 2 connections in this account, top_of_book ${symbols} may be delayed or missing`,
              )
            } else {
              logger.debug({ msg: 'Ignoring system message', message })
            }
            return
          }
          if (message.type === 'error') {
            logger.error({ msg: 'Received error message', message })
            return
          }

          const params = this.subscriptions.get(
            `${message.exchange?.toLowerCase()}-${message.contract?.toUpperCase()}-${message.channel?.toLowerCase()}`,
          )
          if (params === undefined) {
            logger.trace({ msg: 'Skip unsubscribed message', message })
            return []
          }

          const ask = toNumber(message.ask)
          const bid = toNumber(message.bid)
          const mid = toNumber(message.mid)
          if (
            ask === undefined ||
            ask < 0 ||
            bid === undefined ||
            bid < 0 ||
            mid === undefined ||
            mid < 0
          ) {
            logger.error(`Invalid ask/bid/mid in: ${JSON.stringify(message)}`)
            return
          }
          if (bid > mid || ask < mid) {
            logger.error(`bid > mid or ask < mid in: ${JSON.stringify(message)}`)
            return
          }

          const heartbeat = toNumber(new Date(message.heartbeat_at).getTime())
          const time = toNumber(new Date(message.timestamp).getTime())
          if ((heartbeat === undefined || heartbeat <= 0) && (time === undefined || time <= 0)) {
            logger.error(`Invalid heartbeat/timestamp in: ${JSON.stringify(message)}`)
            return
          }

          return [
            {
              params,
              response: {
                result: null,
                data: {
                  mid,
                  ask,
                  bid,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: heartbeat && heartbeat > 0 ? heartbeat : time,
                },
              },
            },
          ]
        },
      },
      builders: {
        // De-dupe subscriptions by exchange so that two requests only differ by exchange is treated as one
        customSubscriptionMessages: (_context, subscriptions) => {
          this.subscriptions = new Map(
            subscriptions.desired.map((p) => [
              `${EXCHANGE_TO_DP[p.exchange]}-${p.base}-${TYPE_TO_CHANNEL[p.type]}`,
              p,
            ]),
          )

          return buildSubscriptionMessages(subscriptions, subscriptionKey, (params, action) => ({
            action,
            channels: [TYPE_TO_CHANNEL[params.type]],
            symbols: [params.base],
            ...(action === 'subscribe' && { format: 'normalized' }),
            ...(action === 'subscribe' &&
              params.type === 'top_of_book_perps' && { quote_mode: 'tick_by_tick' }),
          }))
        },
      },
    })
  }
}

const subscriptionKey = (params: TypeFromDefinition<BaseEndpointTypes['Parameters']>) =>
  `${TYPE_TO_CHANNEL[params.type]}:${params.base}`

export const wsTransport = new StockWebSocketTransport()
