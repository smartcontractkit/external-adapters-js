import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getPasswordFromEnvVar, httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    clientId: {
      required: true,
      type: 'string',
      description: 'The client ID associated with the fund',
    },
    isin: {
      required: true,
      type: 'string',
      description: 'The ISIN identifying the fund',
    },
  },
  [
    {
      clientId: 'abc123',
      isin: 'A0B1C2D3',
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
  transport: httpTransport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
  ): AdapterInputError | undefined => {
    getPasswordFromEnvVar(req.requestContext.data.clientId)
    return
  },
})
