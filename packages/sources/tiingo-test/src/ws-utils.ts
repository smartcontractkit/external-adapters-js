import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  WebsocketReverseMappingTransport,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'

// Once WebsocketTransportGenerics type is exported from EA framework this can be removed
type WebsocketTransportGenerics = TransportGenerics & {
  Provider: {
    WsMessage: unknown
  }
}

export class TiingoWebsocketTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  apiKey = ''
}

export class TiingoWebsocketReverseMappingTransport<
  T extends WebsocketTransportGenerics,
  K,
> extends WebsocketReverseMappingTransport<T, K> {
  apiKey = ''
}
