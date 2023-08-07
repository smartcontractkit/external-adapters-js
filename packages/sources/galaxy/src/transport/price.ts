import { getAccessToken } from './util'
import { BaseEndpointTypes } from '../endpoint/price'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'

export interface ProviderMessage {
  type: string
  signal: string
  ts: number
  value: number
}

export type WSTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: ProviderMessage
  }
}

export interface AdapterRequestParams {
  base: string
  quote: string
}

// Split by the characters "_" and "/" as pairs are in this format: "markPrice_BTC/USD"
const SPLIT_PAIR_REGEX = /[_/]+/

const getPair = (params: AdapterRequestParams) => {
  const { base, quote } = params
  return `markPrice_${base.toUpperCase()}/${quote.toUpperCase()}`
}

export const transport = new WebSocketTransport<WSTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAccessToken(context.adapterSettings)
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
              providerIndicatedTimeUnixMs: Math.round(message.ts * 1000), // Provider indicated time is sent in seconds
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
