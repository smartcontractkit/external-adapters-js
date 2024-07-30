import {
  LwbaEndpoint,
  LwbaResponseDataFields,
  lwbaEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/lwba'

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

export type BaseEndpointTypesLwba = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const cryptoLwbaEndpoint = new LwbaEndpoint({
  name: 'crypto-lwba',
  transport,
  inputParameters,
})
