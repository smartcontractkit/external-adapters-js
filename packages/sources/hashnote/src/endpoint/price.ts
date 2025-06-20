import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      aliases: ['to', 'convert'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'BTC',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: httpTransport,
  inputParameters,
  overrides: overrides['hashnote'],
})
