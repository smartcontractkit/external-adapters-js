import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypesForexContinuous } from '../endpoint/forex-continuous'
import {
  WsMessage,
  WsPriceMessage,
  createSubscriptionBuilders,
  handleInfoMessage,
  parseProviderTime,
  wsOpenHandler,
} from './utils'

// Forex continuous uses '-' separator (e.g., "ARS-USD") and 'ask' field
const PAIR_SEPARATOR = '-'

type WsTransportTypes = BaseEndpointTypesForexContinuous & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.FOREX_CONTINUOUS_WS_API_ENDPOINT,
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
        !priceMessage.ask
      ) {
        return
      }

      const [base, quote] = priceMessage.currencyPair.split(PAIR_SEPARATOR)
      return [
        {
          params: { base, quote },
          response: {
            result: null,
            data: {
              bid: priceMessage.bid,
              mid: priceMessage.mid,
              ask: priceMessage.ask,
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
