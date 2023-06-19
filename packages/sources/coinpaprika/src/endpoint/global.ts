import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/global'
import overrides from '../config/overrides.json'
export const inputParameters = new InputParameters({
  market: {
    aliases: ['to', 'quote'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  resultPath: {
    description: 'The path to the result within the asset quote in the provider response',
    required: false,
    type: 'string',
    options: ['market_cap_', '_dominance_percentage'],
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

// Maps the input parameter value with the value that will be set in the requestContext.data object
const resultPathMap = {
  globalmarketcap: 'market_cap_',
  dominance: '_dominance_percentage',
} as const

export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  aliases: ['dominance'],
  transport,
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
  inputParameters,
  overrides: overrides.coinpaprika,
})
