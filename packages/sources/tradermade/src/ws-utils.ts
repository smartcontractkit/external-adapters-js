import { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'

export class TraderMadeWebsocketReverseMappingTransport<
  T extends WebsocketTransportGenerics,
  K,
> extends WebsocketReverseMappingTransport<T, K> {
  apiKey = ''
}
