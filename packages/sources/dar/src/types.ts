import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from './config'

export interface AuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface ProviderMessage {
  darAssetID: string
  darAssetTicker: string
  quoteCurrency: string
  price: number
  publishedAt: string
  effectiveTime: number
  errors: string
}

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type PriceEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    WsMessage: ProviderMessage
  }
}
