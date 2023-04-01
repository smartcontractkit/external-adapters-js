import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpointParams,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameter } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from './config'

export type TpIcapInputParameters = PriceEndpointInputParameters & { TpIcapSource: InputParameter }

export type TpIcapWebsocketGenerics = WebsocketTransportGenerics & {
  Request: {
    Params: PriceEndpointParams & { TpIcapSource?: string }
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
