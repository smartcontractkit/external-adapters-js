import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/wintermute'
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

interface WsPriceResponse {
  success: boolean
  data: Array<PriceMessage>
  topic: 'price'
}

interface WsRebalanceResponse {
  success: boolean
  data: Array<RebalanceMessage>
  topic: 'rebalance_status'
}

export type WsResponse = WsPriceResponse | WsRebalanceResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsResponse
  }
}

const logger = makeLogger('WintermuteTransport')

export const options: WebSocketTransportConfig<WsTransportTypes> = {
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => ({
    headers: {
      'X-GMCI-API-KEY': context.adapterSettings.API_KEY,
    },
  }),

  handlers: {
    message(message: WsResponse) {
      if (message.success === false) {
        logger.info(message)
        return
      }

      const results = []

      if (message.topic === 'price') {
        for (const item of message.data) {
          results.push({
            params: { symbol: item.symbol },
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
        args: [`price.${params.symbol}`.toLowerCase()],
      }
    },

    unsubscribeMessage: (params) => {
      return {
        op: 'unsubscribe',
        args: [`price.${params.symbol}`.toLowerCase()],
      }
    },
  },
}

export const transport = new WebSocketTransport(options)
