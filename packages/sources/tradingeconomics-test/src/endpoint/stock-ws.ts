import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { Message, withApiKey } from './price-ws'
import { StockEndpointTypes } from './stock-router'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TradingEconomics WS stock')

export type WSEndpointTypes = StockEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}
export const wsTransport = new WebSocketTransport<WSEndpointTypes>({
  url: (context) => {
    const { API_CLIENT_KEY, API_CLIENT_SECRET, WS_API_ENDPOINT } = context.adapterSettings
    return withApiKey(WS_API_ENDPOINT, API_CLIENT_KEY, API_CLIENT_SECRET)
  },
  handlers: {
    message: (message) => {
      if (!message.topic || message.topic === 'keepalive') {
        return []
      }
      const base = message.s
      if (!base) {
        logger.error(`No symbol information in message`)
        return []
      }

      if (message.price === undefined) {
        return [
          {
            params: { base },
            response: {
              errorMessage: `Tradingeconomics provided no data for ${base}`,
              statusCode: 502,
            },
          },
        ]
      }

      return [
        {
          params: { base },
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
      return { topic: 'subscribe', to: param.base }
    },
  },
})
