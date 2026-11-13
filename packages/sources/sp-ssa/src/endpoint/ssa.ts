import { NumericResultEndpoint } from '@chainlink/external-adapter-framework/adapter/numeric-result'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { config } from '../config'
import { ssaTransport } from '../transport/ssa'

export const inputParameters = new InputParameters(
  {
    security_id: {
      description: 'The S&P security identifier to report, for example SP-EURC',
      type: 'string',
      required: true,
    },
  },
  [
    {
      security_id: 'SP-EURC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new NumericResultEndpoint({
  name: 'ssa',
  aliases: [],
  transport: ssaTransport,
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.security_id = req.requestContext.data.security_id.toUpperCase()
    },
  ],
})
