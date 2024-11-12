import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import presetIds from '../config/presetids.json'
import { httpTransport } from '../transport/crypto'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'sym', 'symbol'],
      description: 'The symbol of symbols of the currency to query',
      required: true,
      type: 'string',
    },
    quote: {
      aliases: ['to', 'market', 'convert'],
      description: 'The symbol of the currency to convert to',
      required: true,
      type: 'string',
    },
    cid: {
      description: 'The CMC coin ID (optional to use in place of base)',
      required: false,
      type: 'string',
    },
    slug: {
      description: 'The CMC coin ID (optional to use in place of base)',
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
      base: 'BTC',
      quote: 'USD',
      resultPath: 'price',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

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
      const { base, cid } = request.requestContext.data
      const normalizedBase = base.toUpperCase()
      const idsMap = presetIds as Record<string, number>
      if (!cid && idsMap[normalizedBase]) {
        request.requestContext.data.cid = idsMap[normalizedBase].toString()
      }

      if (!request.requestContext.data.resultPath) {
        const endpoint =
          (request.body.data as { endpoint: keyof typeof resultPathMap }).endpoint ||
          request.requestContext.endpointName
        request.requestContext.data.resultPath = resultPathMap[endpoint]
      }
    },
  ],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.coinmarketcap,
})
