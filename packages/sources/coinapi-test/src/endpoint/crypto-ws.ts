import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { RequestParams } from '../crypto-utils'

export interface WsMessage {
  time: string
  asset_id_base: string
  asset_id_quote: string
  rate: number
  type: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: WsMessage
  }
}

let apikey = ''
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    apikey = context.adapterSettings.API_KEY
    return context.adapterSettings.WS_API_ENDPOINT
  },
  handlers: {
    message(message) {
      if (message.type !== 'exrate') {
        return []
      }
      return [
        {
          params: { base: message.asset_id_base, quote: message.asset_id_quote },
          response: {
            data: {
              result: message.rate,
            },
            result: message.rate,
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        type: 'hello',
        apikey: apikey,
        heartbeat: false,
        subscribe_data_type: ['exrate'],
        subscribe_filter_asset_id: [`${params.base}/${params.quote}`],
      }
    },
  },
})
