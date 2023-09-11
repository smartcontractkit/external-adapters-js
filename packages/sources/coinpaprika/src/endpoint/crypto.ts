import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/crypto'
import overrides from '../config/overrides.json'
export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      description: 'The symbol of symbols of the currency to query',
      required: true,
      type: 'string',
    },
    quote: {
      aliases: ['to', 'market'],
      description: 'The symbol of the currency to convert to',
      required: true,
      type: 'string',
    },
    coinid: {
      description: 'The coin ID (optional to use in place of `base`)',
      required: false,
      type: 'string',
    },
    resultPath: {
      description: 'The path to the result within the asset quote in the provider response',
      required: false,
      type: 'string',
      options: ['price', 'volume_24h', 'market_cap'],
    },
  },
  [
    {
      base: 'AAAA',
      coinid: 'eth-ethereum',
      quote: 'USD',
      resultPath: 'price',
    },
    {
      base: 'ETH',
      quote: 'USD',
      resultPath: 'volume_24h',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

// Maps the input parameter value with the value that will be set in the requestContext.data object
const resultPathMap = {
  price: 'price',
  crypto: 'price',
  volume: 'volume_24h',
  marketcap: 'market_cap',
} as const

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['price', 'marketcap', 'volume'],
  requestTransforms: [
    (request) => {
      if (!request.requestContext.data.resultPath) {
        const endpoint =
          (request.body.data as { endpoint: keyof typeof resultPathMap }).endpoint ||
          request.requestContext.endpointName
        request.requestContext.data.resultPath = resultPathMap[endpoint]
      }
    },
  ],
  transport,
  inputParameters: inputParameters,
  overrides: overrides.coinpaprika,
})
