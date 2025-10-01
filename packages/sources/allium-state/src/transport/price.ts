import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface AlliumMessage {
  type: string
  subscription_id?: string
  subscription_details?: {
    base: string
    quote: string
  }
  error?: string
  timestamp?: string
  data?: {
    base: string
    quote: string
    state_price: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: AlliumMessage
  }
}

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => {
    return context.adapterSettings.WS_API_ENDPOINT
  },

  options: (context) => ({
    headers: {
      'X-API-Key': context.adapterSettings.API_KEY,
    },
  }),

  handlers: {
    message(message) {
      if (message?.type !== 'aggregated_state_price_update' || !message?.data?.state_price) {
        return []
      }

      const { base, quote, state_price } = message.data
      const providerDataReceivedUnixMs = Date.now()
      const providerIndicatedTimeUnixMs = new Date(message.timestamp).getTime()

      return [
        {
          params: { base, quote },
          response: {
            data: {
              result: state_price,
            },
            result: state_price,
            timestamps: {
              providerDataReceivedUnixMs,
              providerIndicatedTimeUnixMs,
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
        base: params.base,
        quote: params.quote,
      }
    },

    unsubscribeMessage: (params) => {
      return {
        type: 'unsubscribe',
        base: params.base,
        quote: params.quote,
      }
    },
  },
})
