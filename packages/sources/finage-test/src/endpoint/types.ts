import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const priceInputParameters = new InputParameters({
  ...priceEndpointInputParametersDefinition,
  base: {
    ...priceEndpointInputParametersDefinition.base,
    aliases: ['from', 'coin', 'symbool'],
  },
})

export type PriceEndpointTypes = {
  Parameters: typeof priceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
