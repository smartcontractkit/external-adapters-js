import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypesLwba } from '../endpoint/crypto-lwba'
import {
  WsMessage,
  WsPriceMessage,
  createSubscriptionBuilders,
  handleInfoMessage,
  parseProviderTime,
  wsOpenHandler,
} from './utils'

const logger = makeLogger('NcfxLwbaEndpoint')

// Crypto LWBA uses '/' separator (e.g., "ETH/USD") and 'offer' field for ask price
const PAIR_SEPARATOR = '/'

type WsTransportTypes = BaseEndpointTypesLwba & {
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
      // Crypto feed uses 'offer' field instead of 'ask'
      if (
        !priceMessage.currencyPair ||
        !priceMessage.mid ||
        !priceMessage.bid ||
        !priceMessage.offer
      ) {
        logger.debug('WS message does not contain valid data, skipping')
        return
      }

      const [base, quote] = priceMessage.currencyPair.split(PAIR_SEPARATOR)
      return [
        {
          params: { base, quote },
          response: {
            result: null,
            data: {
              bid: priceMessage.bid || 0,
              mid: priceMessage.mid || 0,
              ask: priceMessage.offer || 0, // Map 'offer' to 'ask' in response
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
