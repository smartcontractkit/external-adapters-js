import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/indicator'

export const inputParameters = new InputParameters(
  {
    currency: {
      required: true,
      type: 'string',
      description: 'The three-letter code of the currency the indicator belongs to',
    },
    indicator: {
      required: true,
      type: 'string',
      description: 'The name of the macroeconomic indicator, e.g. `inflation` or `policy_rate`',
    },
  },
  [
    {
      currency: 'USD',
      indicator: 'inflation',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'indicator',
  transport: httpTransport,
  inputParameters,
})
