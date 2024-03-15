import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/trueusd'

export const inputParameters = new InputParameters(
  {
    field: {
      default: 'totalTrust',
      description: 'The object-path string to parse a single `result` value.',
      type: 'string',
    },
  },
  [
    {
      field: 'totalTrust',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      ripcord: boolean
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'trueusd',
  transport: httpTransport,
  inputParameters,
})
