import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import {
  WebsocketReverseMappingTransport,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'

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
