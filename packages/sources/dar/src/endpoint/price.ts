import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { PriceEndpointTypes } from '../types'
import { getAuthToken } from '../util'

const logger = makeLogger('DarPriceEndpoint')

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAuthToken(context.adapterConfig)
    return {
      headers: { Authorization: token },
    }
  },
  handlers: {
    message(message) {
      if (message.errors) {
        logger.error('WS message errors', message.errors)
        return []
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
              providerIndicatedTime: new Date(message.publishedAt).getTime(),
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
  inputParameters: priceEndpointInputParameters,
})
