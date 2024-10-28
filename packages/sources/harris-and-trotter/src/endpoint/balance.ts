import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/balance'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { getApiKeys } from '../transport/utils'

export const inputParameters = new InputParameters(
  {
    clientName: {
      required: true,
      type: 'string',
      description: 'The name of the client to retrieve balances for.',
    },
    apiKey: {
      type: 'string',
      description:
        'Alternative api keys to use for this request, ${apiKey}_API_KEY required in environment variables',
      default: '',
    },
  },
  [
    {
      clientName: 'TUSD',
      apiKey: '',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'balance',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request, settings): AdapterInputError | undefined => {
    getApiKeys(request.requestContext.data.apiKey, settings)
    return
  },
})
