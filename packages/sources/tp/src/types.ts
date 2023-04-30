import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from './config'
import { inputParameters } from './endpoint/price'

export type TpIcapWebsocketGenerics = WebsocketTransportGenerics & {
  Parameters: typeof inputParameters.definition
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
