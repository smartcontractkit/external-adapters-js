import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { httpTransport, getCreds } from '../transport/reserves'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    client: {
      description:
        'Used to match ${client}_API_ENDPOINT ${client}_VERIFICATION_PUBKEY environment variables',
      type: 'string',
      default: 'gousd',
    },
  },
  [
    {
      client: 'gousd',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (request, adapterSettings): AdapterInputError | undefined => {
    getCreds(
      request.requestContext.data.client,
      adapterSettings.API_ENDPOINT,
      adapterSettings.VERIFICATION_PUBKEY,
    )
    return
  },
})
