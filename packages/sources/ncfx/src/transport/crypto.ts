import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/crypto'
import {
  WsMessage,
  WsPriceMessage,
  createSubscriptionBuilders,
  handleInfoMessage,
  parseProviderTime,
  wsOpenHandler,
} from './utils'

// Crypto uses '/' separator (e.g., "ETH/USD") and 'offer' field for ask price
const PAIR_SEPARATOR = '/'

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  handlers: {
    open: wsOpenHandler,

    message(message: WsMessage) {
      if (handleInfoMessage(message)) {
        return
      }

      const priceMessage = message as WsPriceMessage
      if (
        !priceMessage.currencyPair ||
        !priceMessage.mid ||
        !priceMessage.bid ||
        !priceMessage.offer
      ) {
        return
      }

      const [base, quote] = priceMessage.currencyPair.split(PAIR_SEPARATOR)
      return [
        {
          params: { base, quote },
          response: {
            result: priceMessage.mid,
            data: {
              result: priceMessage.mid,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: parseProviderTime(priceMessage.timestamp),
            },
          },
        },
      ]
    },
  },
  builders: createSubscriptionBuilders(PAIR_SEPARATOR),
})
