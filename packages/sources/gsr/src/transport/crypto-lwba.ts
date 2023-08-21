import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/crypto-lwba'
import { getToken } from './authutils'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('GSR WS LWBA price')

type WsMessage = {
  type: string
  data: {
    symbol: string
    price: number
    bidPrice: number
    askPrice: number
    ts: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.LWBA_WS_API_ENDPOINT,
  options: async (context) => ({
    headers: {
      'x-auth-token': await getToken(
        context.adapterSettings.LWBA_API_ENDPOINT,
        context.adapterSettings.LWBA_WS_USER_ID,
        context.adapterSettings.LWBA_WS_PUBLIC_KEY,
        context.adapterSettings.LWBA_WS_PRIVATE_KEY,
      ),
      'x-auth-userid': context.adapterSettings.LWBA_WS_USER_ID,
    },
  }),

  handlers: {
    open: () => {
      return
    },
    message(message): ProviderResult<WsTransportTypes>[] | undefined {
      if (message.type == 'error') {
        logger.error(`Got error from DP: ${JSON.stringify(message)}`)
        return
      } else if (message.type != 'ticker') {
        return
      }

      const pair = message.data.symbol.split('.')
      if (pair.length != 2) {
        logger.warn(`Got a price update with an unknown pair: ${message.data.symbol}`)
        return
      }

      return [
        {
          params: {
            base: pair[0].toString(),
            quote: pair[1].toString(),
          },
          response: {
            result: null,
            data: {
              mid: message.data.price,
              bid: message.data.bidPrice,
              ask: message.data.askPrice,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Math.round(message.data.ts / 1e6), // Value from provider is in nanoseconds
            },
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => ({
      action: 'subscribe',
      symbols: [`${params.base.toUpperCase()}.${params.quote.toUpperCase()}`],
    }),
    unsubscribeMessage: (params) => ({
      action: 'unsubscribe',
      symbols: [`${params.base.toUpperCase()}.${params.quote.toUpperCase()}`],
    }),
  },
})
