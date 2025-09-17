import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { baseOptions, WsTransportTypes } from './shared'

export const options: WebSocketTransportConfig<WsTransportTypes> = {
  ...baseOptions,
  url: (context: EndpointContext<WsTransportTypes>) =>
    context.adapterSettings.WINTERMUTE_WS_API_ENDPOINT,
  options: async (context: EndpointContext<WsTransportTypes>) => ({
    headers: {
      'X-GMCI-API-KEY': context.adapterSettings.WINTERMUTE_API_KEY,
    },
  }),
}

export const wintermuteTransport = new WebSocketTransport(options)
