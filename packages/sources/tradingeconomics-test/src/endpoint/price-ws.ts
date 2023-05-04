import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from './price-router'

const logger = makeLogger('TradingEconomics WS Price')

export interface Message {
  s: string
  i: string
  pch: number
  nch: number
  bid: number
  ask: number
  price: number
  dt: number
  state: string
  type: string
  dhigh: number
  dlow: number
  o: number
  prev: number
  topic: string
}

type WSEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const wsTransport: WebsocketReverseMappingTransport<WSEndpointTypes, string> =
  new WebsocketReverseMappingTransport<WSEndpointTypes, string>({
    url: (context) => {
      const { API_CLIENT_KEY, API_CLIENT_SECRET, WS_API_ENDPOINT } = context.adapterSettings
      return `${WS_API_ENDPOINT}?client=${API_CLIENT_KEY}:${API_CLIENT_SECRET}`
    },
    handlers: {
      message: (message) => {
        if (!message.topic || message.topic === 'keepalive') {
          return []
        }
        const pair = wsTransport.getReverseMapping(message.s)
        if (!pair) {
          logger.error(`Pair not found in websocket reverse map for message symbol - ${message.s}`)
          return []
        }
        if (message.price === undefined) {
          const message = `Tradingeconomics provided no data for ${JSON.stringify(pair)}`
          logger.info(message)
          return [
            {
              params: pair,
              response: {
                errorMessage: message,
                statusCode: 502,
              },
            },
          ]
        }

        return [
          {
            params: pair,
            response: {
              result: message.price,
              data: {
                result: message.price,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.dt).getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (param) => {
        const symbol = `${param.base}${param.quote}:CUR`
        wsTransport.setReverseMapping(symbol, param)
        return { topic: 'subscribe', to: symbol }
      },
    },
  })
