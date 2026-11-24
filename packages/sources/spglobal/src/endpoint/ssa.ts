import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { ssaTransport } from '../transport/ssa'

export const inputParameters = new InputParameters(
  {
    security_id: {
      required: true,
      type: 'string',
      description: 'Identifier of the security',
    },
  },
  [
    {
      security_id: 'example',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'ssa',
  transport: ssaTransport,
  inputParameters,
  requestTransforms: [
    (req) =>
      (req.requestContext.data.security_id = req.requestContext.data.security_id.toUpperCase()),
  ],
})
