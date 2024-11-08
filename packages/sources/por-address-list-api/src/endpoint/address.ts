import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { httpTransport } from '../transport/address'

export const inputParameters = new InputParameters(
  {
    client: {
      required: true,
      options: ['Bedrock uniBTC', 'SolvBTC'],
      type: 'string',
      description: 'Name of the client to retrieve PoR address for',
    },
  },
  [
    {
      client: 'Bedrock uniBTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'address',
  transport: httpTransport,
  inputParameters,
})
