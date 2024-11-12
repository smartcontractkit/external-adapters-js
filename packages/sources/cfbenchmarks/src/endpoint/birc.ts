import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { transport, VALID_TENORS } from '../transport/birc'
import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
export const inputParameters = new InputParameters(
  {
    tenor: {
      description: 'The tenor value to pull from the API response',
      type: 'string',
      options: Object.values(VALID_TENORS),
      required: true,
    },
  },
  [
    {
      tenor: VALID_TENORS.SIRB,
    },
  ],
)
export const endpoint = new AdapterEndpoint({
  name: 'birc',
  transport,
  inputParameters,
})
