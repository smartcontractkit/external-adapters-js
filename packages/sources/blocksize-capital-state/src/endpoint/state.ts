import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { stateTransport } from '../transport/state'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'CBBTC',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  transport: stateTransport,
  inputParameters,
})
