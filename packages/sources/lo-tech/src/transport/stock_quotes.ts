import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'

const logger = makeLogger('lo-tech - stock_quotes')

export type WSResponse =
  | {
      egress_ts: number // microseconds
      data: {
        type: 'PRICE'
        symbol: string
        ingress_ts: number // microseconds
        publish_ts: null
        transaction_ts: number // microseconds
        price: number
        spread: number
      }
    }
  | {
      egress_ts: number // microseconds
      error: {
        error: string
        code: number
        id: null
        info: {
          type: string
          failures: {
            symbol: string
            type: string
          }[]
          succeeded: []
        }
      }
    }
  | {
      egress_ts: number // microseconds
      pong: {
        api_version: string
      }
    }

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

type Region = 'us' | 'asia'

export class StockQuotesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor(region: Region) {
    super({
      url: (context) => context.adapterSettings.REGION_WS_API_ENDPOINT.get(region),
      options: (context) => {
        return {
          headers: {
            'X-API-KEY': context.adapterSettings.REGION_API_KEY.get(region),
          },
        }
      },
      handlers: {
        heartbeat(connection) {
          connection.send(
            JSON.stringify({
              op: 'PING',
            }),
          )
        },
        message(message) {
          if ('error' in message) {
            logger.error(`Received error message on websocket: ${JSON.stringify(message)}`)
            return message.error.info.failures.map((failure) => ({
              params: { base: failure.symbol },
              response: {
                statusCode: 502,
                errorMessage: failure.type,
                timestamps: {
                  providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
                },
              },
            }))
          }

          if ('pong' in message) {
            // Ignore
            return
          }

          if (message.data?.type !== 'PRICE') {
            logger.warn(`Received unsupported message type: ${message.data.type}`)
            return
          }

          const mid_price = message.data.price
          const spread = message.data.spread
          const bid_price = mid_price - spread / 2
          const ask_price = mid_price + spread / 2

          return [
            {
              params: { base: message.data.symbol },
              response: {
                result: null,
                data: {
                  mid_price,
                  bid_price,
                  ask_price,
                  bid_volume: 0,
                  ask_volume: 0,
                  ingress_ts_iso: new Date(message.data.ingress_ts / 1000).toISOString(),
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
                },
              },
            },
          ]
        },
      },
      builders: {
        subscribeMessage: (params) => {
          return {
            op: 'SUBSCRIBE',
            topics: [
              {
                symbol: params.base,
                type: 'PRICE',
              },
            ],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            op: 'UNSUBSCRIBE',
            topics: [
              {
                symbol: params.base,
                type: 'PRICE',
              },
            ],
          }
        },
      },
    })
  }
}
