import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import {
  AdapterRequestData,
  AdapterRequestContext,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from './config'

export type CacheQueryParams = {
  rec: string
}

export type TpIcapWebsocketGenerics = WebsocketTransportGenerics & {
  Request: {
    Params: PriceEndpointParams & { tpIcapInverse: boolean }
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: {
      msg: 'auth' | 'sub'
      pro?: string
      rec: string // example: FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!IC
      sta: number
      img?: number
      fvs?: {
        CCY1?: string // example: "EUR"
        CCY2?: string // example: "USD"
        ACTIV_DATE?: string // example: "2023-03-06"
        TIMACT?: string // example: "15:00:00"
        BID?: number
        ASK?: number
        MID_PRICE?: number
      }
    }
  }
}

// Copied from '@chainlink/external-adapter-framework/adapter/price'
type IncludeDetails = {
  from: string
  to: string
  inverse: boolean
}
export type IncludesMap = Record<string, Record<string, IncludeDetails>>

export type PriceRequestContext<T extends AdapterRequestData> = AdapterRequestContext<T> & {
  priceMeta: {
    inverse: boolean
  }
}
