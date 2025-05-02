import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getApiKey, httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    integration: {
      required: true,
      type: 'string',
      description: 'The integration to query',
    },
  },
  [
    {
      integration: 'example-integration',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  aliases: ['price'],
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request): AdapterError | undefined => {
    getApiKey(request.requestContext.data.integration)
    return
  },
})
