import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { customSettings } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { BatchRequestParams } from '../price-utils'

interface Message {
  symbol: string
  ts: string
  bid: number
  ask: number
  mid: number
}

type EndpointTypes = {
  Request: {
    Params: BatchRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

let apiKey = ''
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    apiKey = context.adapterConfig.WS_API_KEY as string
    return 'wss://marketdata.tradermade.com/feedadv'
  },
  handlers: {
    message(message) {
      // Tradermade returns pair information combined without delimiter, like `symbol: eurusd` which makes it not possible to have base and quote. Once params are passed in the message handler we can use them to have correct base and quote in the response.
      return [
        {
          params: { base: message.symbol, quote: message.symbol },
          response: {
            data: {
              result: message.mid,
            },
            result: message.mid,
          },
        },
      ]
    },
  },

  builders: {
    subscribeMessage: (params) => {
      return {
        userKey: apiKey,
        symbol: `${params.base}${params.quote}`.toUpperCase(),
      }
    },
  },
})
