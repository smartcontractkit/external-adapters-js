import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/crypto-lwba'
import {
  LwbaEndpoint,
  LwbaResponseDataFields,
  lwbaEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const endpoint = new LwbaEndpoint({
  name: 'crypto-lwba',
  transport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
