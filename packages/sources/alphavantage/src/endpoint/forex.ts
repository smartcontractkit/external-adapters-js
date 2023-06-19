import {
  PriceEndpoint,
  PriceEndpointInputParametersDefinition,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/forex'
export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: PriceEndpointInputParametersDefinition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'forex',
  aliases: ['price'],
  transport,
  inputParameters,
})
