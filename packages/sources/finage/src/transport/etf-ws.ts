import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { EtfEndpointTypes } from '../endpoint/utils'
import { EtfMessage, makeEtfWsMessage, makeEtfWsUrl, parseEtfWsMessage } from './utils'

type WsTransportTypes = EtfEndpointTypes & {
  Provider: {
    WsMessage: EtfMessage
  }
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      return makeEtfWsUrl(context.adapterSettings)
    },
    handlers: {
      message(message) {
        const param = wsTransport.getReverseMapping(message.s.toUpperCase())
        return parseEtfWsMessage(param, message)
      },
    },

    builders: {
      subscribeMessage: (params) => {
        const symbol = params.base.toUpperCase()
        wsTransport.setReverseMapping(symbol, params)
        return makeEtfWsMessage('subscribe', symbol)
      },
      unsubscribeMessage: (params) => {
        return makeEtfWsMessage('unsubscribe', params.base.toUpperCase())
      },
    },
  })
