import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { httpTransport } from '../transport/trueusd'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    chain: {
      description: 'Filter data to a single blockchain',
      type: 'string',
    },
    field: {
      // Deprecated - kept for backwards compatability
      default: 'totalTrust',
      description:
        'The object-path string to parse a single `result` value. When not provided the entire response will be provided.',
      type: 'string',
    },
  },
  [
    {
      field: 'totalTrust',
    },
    {
      chain: 'AVA',
      field: 'totakToken',
    },
    {
      chain: 'TUSD (AVAX)',
      field: 'totalTokenByChain',
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
