import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from './config'

export interface AccessTokenResponse {
  token?: string
  message?: string
}

export interface AccessToken {
  token: string
  created: number
}

export interface AdapterRequestParams {
  base: string
  quote: string
}

export interface ProviderMessage {
  type: string
  signal: string
  ts: number
  value: number
}

export type PriceEndpointTypes = {
  Request: {
    Params: AdapterRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: ProviderMessage
  }
}
