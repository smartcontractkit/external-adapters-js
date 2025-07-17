import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'
import { convertTimetoUnixMs } from './util'

export interface PriceMessage {
  last_updated: string
  price: number
  symbol: string
}

export interface RebalanceMessage {
  end_time: string
  start_time: string
  status: string
  symbol: string
}

export interface WsResponse {
  success: boolean
  data: Array<PriceMessage | RebalanceMessage>
  topic: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsResponse
  }
}

export const options: WebSocketTransportConfig<WsTransportTypes> = {
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => ({
    headers: {
      'X-GMCI-API-KEY': context.adapterSettings.API_KEY,
    },
  }),

  handlers: {
    message(message) {
      if (message.success === false) {
        return
      }

      const results = []

      if (message.topic === 'price') {
        for (const item of message.data as PriceMessage[]) {
          results.push({
            params: { index: item.symbol },
            response: {
              result: item.price,
              data: {
                result: item.price,
                symbol: item.symbol,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: convertTimetoUnixMs(item.last_updated),
              },
            },
          })
        }
      }
      return results
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        op: 'subscribe',
        args: [`price.${params.index}`.toLowerCase()],
      }
    },

    unsubscribeMessage: (params) => {
      return {
        op: 'unsubscribe',
        args: [`price.${params.index}`.toLowerCase()],
      }
    },
  },
}

export const transport = new WebSocketTransport(options)
