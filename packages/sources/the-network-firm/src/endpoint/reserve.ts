import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    client: {
      type: 'string',
      required: true,
      description: 'The name of the TNF client to consume from',
    },
    resource: {
      type: 'string',
      required: true,
      description: 'The resource of the TNF to consume eg. reserve',
    },
  },
  [
    {
      client: 'acme',
      resource: 'reserve',
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
})
