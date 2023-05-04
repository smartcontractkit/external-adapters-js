import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { getAccessToken } from '../util'

// Split by the characters "_" and "/" as pairs are in this format: "markPrice_BTC/USD"
const SPLIT_PAIR_REGEX = /[_/]+/

const getPair = (params: AdapterRequestParams) => {
  const { base, quote } = params
  return `markPrice_${base.toUpperCase()}/${quote.toUpperCase()}`
}

export interface AdapterRequestParams {
  base: string
  quote: string
}

export interface ProviderMessage {
  type: string
  signal: string
  ts: number
  value: number
}

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type PriceEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    WsMessage: ProviderMessage
  }
}

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
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

export const priceEndpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['crypto'],
  transport: priceTransport,
  inputParameters,
})
