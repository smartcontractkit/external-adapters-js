import { getAuthToken } from './util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('DarPriceEndpoint')

export interface ProviderMessage {
  darAssetID: string
  darAssetTicker: string
  quoteCurrency: string
  price: number
  publishedAt: string
  effectiveTime: number
  errors: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: ProviderMessage
  }
}

const pairHits: {
  [base: string]: {
    [quote: string]: number
  }
} = {}
let totalUniquePairs = 0
let totalHits = 0

const hitTrackingLevels: { [level: string]: boolean } = {
  debug: true,
  trace: true,
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAuthToken(context.adapterSettings)
    return {
      headers: { Authorization: token },
    }
  },
  handlers: {
    message(message, context) {
      if (message.errors) {
        logger.error(`Got error from DP: ${message.errors}`)
        return []
      }

      if (hitTrackingLevels[context.adapterSettings.LOG_LEVEL]) {
        const { darAssetTicker: base, quoteCurrency: quote } = message

        pairHits[base] ??= {}

        if (!pairHits[base][quote]) {
          pairHits[base][quote] = 1
          totalUniquePairs += 1
        } else {
          pairHits[base][quote] += 1
        }
        totalHits += 1
        logger.debug({ totalHits, totalUniquePairs, pairHits: pairHits[base][quote], base, quote })
      }

      return [
        {
          params: { base: message.darAssetTicker, quote: message.quoteCurrency },
          response: {
            result: message.price,
            data: {
              result: message.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: message.effectiveTime * 1000,
            },
          },
        },
      ]
    },
  },
})
