import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/nav'
export interface ResponseSchema {
  code: number
  message: string
  data: {
    round_id: string
    last_updated_timestamp: number
    symbol: string
    issue_price: string
    redeem_price: string
  } | null
}
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export declare const httpTransport: HttpTransport<HttpTransportTypes>
//# sourceMappingURL=nav.d.ts.map
