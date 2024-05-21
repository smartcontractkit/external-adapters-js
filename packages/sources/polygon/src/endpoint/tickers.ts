import {
  ForexPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/tickers'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'USD',
    quote: 'GBP',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new ForexPriceEndpoint({
  name: 'tickers',
  aliases: ['forex', 'price'],
  transport,
  inputParameters: inputParameters,
})
