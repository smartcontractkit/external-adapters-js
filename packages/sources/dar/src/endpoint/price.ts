import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { PriceEndpointTypes, inputParameters } from '../types'
import { getAuthToken } from '../util'

const logger = makeLogger('DarPriceEndpoint')

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

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
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

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  transport: priceTransport,
  inputParameters,
  aliases: ['crypto'],
})
