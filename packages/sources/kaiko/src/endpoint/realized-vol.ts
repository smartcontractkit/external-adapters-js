import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/realized-vol'

export type ResponseData = {
  [key: string]: number
}

export type RealizedVolResponse = {
  Result: number | null
  Data: ResponseData
}

const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      required: true,
      type: 'string',
      description: 'The base currency to query the realized volatility for',
    },
    quote: {
      aliases: ['to', 'market', 'convert'],
      required: false,
      default: 'USD',
      type: 'string',
      description: 'The quote currency to convert the realized volatility to',
    },
    resultPath: {
      required: false,
      default: 'result',
      type: 'string',
      description: 'The field to return within the result path',
    },
  },
  [
    {
      base: 'ETH',
      quote: 'USD',
      resultPath: 'result',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: RealizedVolResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'realized-vol',
  aliases: ['realized-volatility'],
  transport,
  inputParameters,
  overrides: overrides.kaiko,
})
