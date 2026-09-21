import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { httpTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    client: {
      type: 'string',
      required: true,
      description: 'The name of the TNF client to consume from',
    },
    noErrorOnRipcord: {
      type: 'boolean',
      required: false,
      default: false,
      description:
        'Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset',
    },
  },
  [
    {
      client: 'acme',
      noErrorOnRipcord: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse & {
    ripcordAsInt?: number
    totalReserve?: number
    totalToken?: number
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserve',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request, settings): AdapterError | undefined => {
    if (request.requestContext.data.client) {
      settings.CLIENT_API_KEY.get(request.requestContext.data.client)
    }
    return
  },
})
