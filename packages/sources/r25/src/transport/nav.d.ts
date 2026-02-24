import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
export interface ResponseSchema {
  code: string
  success: boolean
  message: string
  data: {
    lastUpdate: string
    tokenName: string
    chainType: string
    totalSupply: number
    totalAsset: number
    currentNav: string
  } | null
}
export interface ErrorResponseSchema {
  error: string
}
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema | ErrorResponseSchema
  }
}
export declare const httpTransport: HttpTransport<HttpTransportTypes>
//# sourceMappingURL=nav.d.ts.map
