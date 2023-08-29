import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type BaseCryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
