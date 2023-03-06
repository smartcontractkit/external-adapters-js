import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from './config'

export type TPICAPWebsocketGenerics = WebsocketTransportGenerics & {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: {
      msg: 'auth' | 'sub'
      pro?: string
      rec: string // example: FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!IC => Use this to filter out non-spot price messages
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
