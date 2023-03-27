import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
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

export interface AdapterRequestParams {
  base: string
  quote: string
}

export type PriceEndpointTypes = {
  Request: {
    Params: AdapterRequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: ProviderMessage
  }
}
