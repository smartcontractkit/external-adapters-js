import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { stateTransport } from '../transport/state'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['coin', 'from'],
      required: true,
      type: 'string',
      description: 'The base symbol to query (e.g., CBBTC)',
    },
    quote: {
      aliases: ['market', 'to'],
      required: false,
      type: 'string',
      default: 'USD',
      description: 'The quote currency (USD or ETH)',
      options: ['USD', 'ETH'],
    },
  },
  [
    {
      base: 'CBBTC',
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
  name: 'blocksize-capital-state',
  aliases: ['state'],
  transport: stateTransport,
  inputParameters,
  overrides: overrides['blocksize-capital-state'],
})
