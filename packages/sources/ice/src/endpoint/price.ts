import {
  LwbaEndpoint,
  lwbaEndpointInputParametersDefinition,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/price'

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition, [
  {
    base: 'EUR',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: LwbaResponseDataFields
  Settings: typeof config.settings
}

export const endpoint = new LwbaEndpoint({
  name: 'price',
  aliases: ['latest-price', 'data-price', 'getReqObjPrice'],
  transport: transport,
  inputParameters,
})
