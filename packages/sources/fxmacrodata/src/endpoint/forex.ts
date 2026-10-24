import {
  ForexPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/forex'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'EUR',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new ForexPriceEndpoint({
  name: 'forex',
  aliases: ['price'],
  transport: httpTransport,
  inputParameters,
})
