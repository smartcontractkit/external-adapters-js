import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/conversion'

export const inputParameters = new InputParameters(
  {
    ...priceEndpointInputParametersDefinition,
    amount: {
      required: false,
      description: 'The amount of the `base` to convert ',
      default: 1,
      type: 'number',
    },
    precision: {
      required: false,
      description: 'The number of significant figures to include',
      default: 6,
      type: 'number',
    },
  },
  [
    {
      base: 'GBP',
      quote: 'USD',
      amount: 1,
      precision: 6,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'conversion',
  transport,
  inputParameters: inputParameters,
})
