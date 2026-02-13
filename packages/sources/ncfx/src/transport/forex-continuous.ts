import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypesForexContinuous } from '../endpoint/forex-continuous'
import {
  WsMessage,
  WsPriceMessage,
  createSubscriptionBuilders,
  handleInfoMessage,
  parseProviderTime,
  wsOpenHandler,
} from './utils'

const logger = makeLogger('NcfxForexContinuousEndpoint')

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
              ask: priceMessage.ask || 0,
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
