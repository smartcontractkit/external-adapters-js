import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const priceInputParameters = new InputParameters({
  ...priceEndpointInputParametersDefinition,
  base: {
    ...priceEndpointInputParametersDefinition.base,
    aliases: ['from', 'coin', 'symbol'],
  },
})

export type PriceEndpointTypes = {
  Parameters: typeof priceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const equitiesInputParameters = new InputParameters({
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of the equity to query',
  },
})

export type EquitiesEndpointTypes = {
  Parameters: typeof equitiesInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
