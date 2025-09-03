import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getApiKey, httpTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    client: {
      type: 'string',
      required: true,
      description: 'The name of the TNF client to consume from',
    },
  },
  [
    {
      client: 'acme',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserve',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request): AdapterError | undefined => {
    if (request.requestContext.data.client) {
      getApiKey(request.requestContext.data.client)
    }
    return
  },
})
