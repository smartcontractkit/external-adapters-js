import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { httpTransport } from '../transport/rate'

export const inputParameters = new InputParameters(
  {
    symbol: {
      required: true,
      type: 'string',
      description: 'Symbol of the rate you are looking for',
    },
  },
  [
    {
      symbol: 'SOFR',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'rate',
  transport: httpTransport,
  inputParameters,
})
