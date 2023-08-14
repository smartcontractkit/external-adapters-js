import {
  PoRBalanceEndpoint,
  porBalanceEndpointInputParametersDefinition,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/balance'

export const inputParameters = new InputParameters(porBalanceEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: PoRBalanceResponse
}

export const balanceEndpoint = new PoRBalanceEndpoint({
  name: 'balance',
  transport,
  inputParameters,
})
