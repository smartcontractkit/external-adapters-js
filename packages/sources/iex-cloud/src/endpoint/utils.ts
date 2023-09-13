import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'

export const stockInputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'USD',
  },
])

export type StockBaseEndpointTypes = {
  Parameters: typeof stockInputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
