import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { kaikoStateTransport } from '../transport/state'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to query',
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
      base: 'ageur',
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
  name: 'state',
  aliases: [],
  transport: kaikoStateTransport,
  inputParameters,
  requestTransforms: [
    (request) => {
      request.requestContext.data.base = request.requestContext.data.base.toUpperCase()
      request.requestContext.data.quote = request.requestContext.data.quote.toUpperCase()
    },
  ],
})
