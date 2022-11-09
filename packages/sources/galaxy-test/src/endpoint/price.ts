import { DEFAULT_WS_API_ENDPOINT } from '../config'
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
  const { base = '', quote = '' } = params
  return base && quote && `markPrice_${base.toUpperCase()}/${quote.toUpperCase()}`
}

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
  url: () => DEFAULT_WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAccessToken(context.adapterConfig)
    return {
      headers: { token: token?.token || '' },
    }
  },
  handlers: {
    open: () => undefined,
    message(message) {
      if (message.type !== 'signal_update') return []
      const [_, base, quote] = message.signal.split(SPLIT_PAIR_REGEX)
      return [
        {
          params: { base, quote },
          value: message.value,
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params) => JSON.stringify({ type: 'subscribe', signals: [getPair(params)] }),
    unsubscribeMessage: (params) =>
      JSON.stringify({ type: 'unsubscribe', signals: [getPair(params)] }),
  },
})

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  transport: priceTransport,
  inputParameters: priceEndpointInputParameters,
})
