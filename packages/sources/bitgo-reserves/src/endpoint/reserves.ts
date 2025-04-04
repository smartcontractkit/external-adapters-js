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
    if (request.requestContext.data.client != 'gousd') {
      getCreds(request.requestContext.data.client)
    } else if (adapterSettings.VERIFICATION_PUBKEY.length == 0) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing VERIFICATION_PUBKEY environment variable.`,
      })
    }
    return
  },
})
