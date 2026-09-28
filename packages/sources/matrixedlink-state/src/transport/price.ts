import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('PriceWebSocketTransport')

interface WsPingMessage {
  type: 'ping'
}

interface WsPriceResponse {
  type: 'aggregated_price_update'
  timestamp: string
  data: {
    depth_minus_1pct_usd: number
    price: number
    data_status: string
    quote: string
    volume_7d_usd: number
    block_time: string
    base: string
    depth_plus_1pct_usd: number
    market_status: string | null
  }
}

interface WsErrorResponse {
  type: 'error'
  code: string
  base: string
  quote: string
  message: string
}

export type WSResponse = WsPingMessage | WsPriceResponse | WsErrorResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export class PriceWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor() {
    let wsConnection: WebSocket | null = null

    super({
      url: (context) =>
        `${context.adapterSettings.WS_API_ENDPOINT}?api_key=${context.adapterSettings.API_KEY}`,
      handlers: {
        open: (ws) => {
          wsConnection = ws
        },
        message(message) {
          if (message.type === 'ping') {
            wsConnection?.send(JSON.stringify({ type: 'pong' }))
            return
          }

          if (message.type === 'error') {
            return [
              {
                params: { base: message.base, quote: message.quote },
                response: {
                  statusCode: 502,
                  errorMessage: message.message,
                },
              },
            ]
          }

          if (message.type !== 'aggregated_price_update') {
            logger.warn({ msg: 'Ignoring unexpected message', unexpectedMessage: message })
            return
          }

          const { base, quote, price: result } = message.data

          return [
            {
              params: { base, quote },
              response: {
                result,
                data: {
                  result,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: new Date(message.timestamp).getTime(),
                },
              },
            },
          ]
        },
      },
      builders: {
        subscribeMessage: (params) => {
          return {
            type: 'subscribe',
            base: params.base.toUpperCase(),
            quote: params.quote.toUpperCase(),
          }
        },
        unsubscribeMessage: (params) => {
          return {
            type: 'unsubscribe',
            base: params.base.toUpperCase(),
            quote: params.quote.toUpperCase(),
          }
        },
      },
    })
  }
}

export const wsTransport = new PriceWebSocketTransport()
