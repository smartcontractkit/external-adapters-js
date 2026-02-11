import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { baseOptions, WsTransportTypes } from './shared'

export const options: WebSocketTransportConfig<WsTransportTypes> = {
  ...baseOptions,
  url: (context: EndpointContext<WsTransportTypes>) => context.adapterSettings.GMCI_WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => ({
    headers: {
      'X-GMCI-API-KEY': context.adapterSettings.GMCI_API_KEY,
    },
  }),
}

export const gmciTransport = new WebSocketTransport(options)
