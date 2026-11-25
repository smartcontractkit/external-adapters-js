import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/markprice'

type WsMessage = {
  egress_ts: number
  data: {
    type: string
    symbol: string
    bid_price: string
    ask_price: string
  }
}

type ErrorMessage = {
  error: {
    info: {
      failures: {
        raw: {
          symbol: string
        }
        message: string
      }[]
    }
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage | ErrorMessage
  }
}

const logger = makeLogger('markprice')

export class MarkPriceSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor(venue: string) {
    super({
      url: (context) => `${context.adapterSettings.WS_API_ENDPOINT.replace(/\/+$/, '')}/${venue}`,
      options: (context) => ({ headers: { 'X-API-KEY': context.adapterSettings.FUTURES_API_KEY } }),
      handlers: {
        heartbeat(connection) {
          connection.send(JSON.stringify({ op: 'PING' }))
        },
        message(message) {
          if ('error' in message) {
            logger.error(`Received error message on websocket: ${JSON.stringify(message)}`)
            return message.error.info.failures.map((data) => ({
              params: { base: data.raw.symbol, exchange: venue },
              response: {
                statusCode: 502,
                errorMessage: data.message,
              },
            }))
          }
          if ('pong' in message) {
            return
          }

          if (message.data?.type !== 'TOP_OF_BOOK') {
            logger.warn(`Received unsupported message: ${JSON.stringify(message)}`)
            return
          }

          const ask = parseNumber(message.data.ask_price)
          const bid = parseNumber(message.data.bid_price)
          const time = parseNumber(message.egress_ts)
          if (isNaN(ask) || isNaN(bid) || isNaN(time) || time <= 0) {
            logger.error(`Invalid ask/bid/egress_ts in: ${JSON.stringify(message)}`)
            return
          }

          if (bid > ask) {
            logger.error(`bid > ask in: ${JSON.stringify(message)}`)
            return
          }

          return [
            {
              params: { base: message.data.symbol.toUpperCase(), exchange: venue },
              response: {
                result: null,
                data: {
                  mid: (ask + bid) / 2,
                  ask,
                  bid,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: Math.floor(time / 1000),
                },
              },
            },
          ]
        },
      },
      builders: {
        subscribeMessage: (params) => ({
          op: 'SUBSCRIBE',
          topics: [{ symbol: params.base, type: 'TOP_OF_BOOK', freq: 10, quote: 'USD' }],
        }),
        unsubscribeMessage: (params) => ({
          op: 'UNSUBSCRIBE',
          topics: [{ symbol: params.base, type: 'TOP_OF_BOOK', freq: 10, quote: 'USD' }],
        }),
      },
    })
  }
}

const parseNumber = (v?: string | number) => {
  if (v === undefined || v === null || String(v).trim() === '') return NaN
  const number = Number(v)
  if (!isFinite(number) || number < 0) return NaN
  return number
}
