import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { apiAddressTransport } from '../transport/apiAddress'

export const inputParameters = new InputParameters(
  {
    apiClient: {
      required: true,
      options: ['Bedrock uniBTC', 'SolvBTC'],
      type: 'string',
      description: 'Which API to fetch wallet address from',
    },
  },
  [
    {
      apiClient: 'SolvBTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'apiAddress',
  transport: apiAddressTransport,
  inputParameters,
})
