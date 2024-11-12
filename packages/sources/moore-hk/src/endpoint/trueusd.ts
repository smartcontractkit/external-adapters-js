import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
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
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'trueusd',
  transport: httpTransport,
  inputParameters,
})
