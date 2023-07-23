import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'

export const priceInputParameters = new InputParameters({
  ...priceEndpointInputParametersDefinition,
  base: {
    ...priceEndpointInputParametersDefinition.base,
    aliases: ['from', 'coin', 'symbol'],
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof priceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const equitiesInputParameters = new InputParameters(stockEndpointInputParametersDefinition)

export type EquitiesEndpointTypes = {
  Parameters: typeof equitiesInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
