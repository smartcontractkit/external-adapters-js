import { inputParameters } from './crypto'
import { customInputValidation } from './utils'
import { wsTransport } from '../transport/crypto-lwba'
import { config } from '../config'
import { LwbaEndpoint, LwbaResponseDataFields } from '@chainlink/external-adapter-framework/adapter'
import { requestTransform } from './utils'

export type BaseEndpointTypes = {
  // leaving Parameters as crypto inputParameters for backward compatibility
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const requestTransforms = [requestTransform('crypto-lwba')]

export const endpoint = new LwbaEndpoint({
  name: 'crypto-lwba',
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms,
  customInputValidation,
})
