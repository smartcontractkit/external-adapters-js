import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { getAccessToken } from '../util'
import { AdapterRequestParams, PriceEndpointTypes } from '../types'

// Split by the characters "_" and "/" as pairs are in this format: "markPrice_BTC/USD"
const SPLIT_PAIR_REGEX = /[_/]+/

const getPair = (params: AdapterRequestParams) => {
  const { base, quote } = params
  return `markPrice_${base.toUpperCase()}/${quote.toUpperCase()}`
}

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAccessToken(context.adapterConfig)
    return {
      headers: { token: token?.token || '' },
    }
  },
  handlers: {
    message(message) {
      if (message.type !== 'signal_update') return []
      const [_, base, quote] = message.signal.split(SPLIT_PAIR_REGEX)
      return [
        {
          params: { base, quote },
          response: {
            result: message.value,
            data: {
              result: message.value,
            },
            timestamps: {
              providerIndicatedTime: Math.round(message.ts * 1000), // Provider indicated time is sent in seconds
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params) => ({ type: 'subscribe', signals: [getPair(params)] }),
    unsubscribeMessage: (params) => ({ type: 'unsubscribe', signals: [getPair(params)] }),
  },
})

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  transport: priceTransport,
  inputParameters: priceEndpointInputParameters,
})
