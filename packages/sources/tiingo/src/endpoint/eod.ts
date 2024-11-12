import {
  StockEndpoint,
  stockEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter/stock'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/eod'

const inputParameters = new InputParameters(stockEndpointInputParametersDefinition, [
  {
    base: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new StockEndpoint({
  name: 'eod',
  transport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
