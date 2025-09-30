import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
// import overrides from '../config/overrides.json'
import { stateTransport } from '../transport/state'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to query',
    },
    quote: {
      aliases: ['to', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'LUSD',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      timestamp: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'coinpaprika-state',
  aliases: ['state'],
  transport: stateTransport,
  inputParameters,
  requestTransforms: [
    (request) => {
      request.requestContext.data.base = request.requestContext.data.base.trim().toUpperCase()
      request.requestContext.data.quote = request.requestContext.data.quote.trim().toUpperCase()
    },
  ],
})
