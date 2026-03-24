import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, ResponseGenerics } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { inputParameters } from '../endpoint/shared'

type WsTransportTypes<WsMessage, Response extends ResponseGenerics> = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: Response
  Provider: { WsMessage: WsMessage }
}

export const createWsTransport = <WsMessage, Response extends ResponseGenerics>({
  region,
  apiKey,
  apiPath,
  type,
  messageHandler,
}: {
  region: string
  apiKey: string | undefined
  apiPath: string
  type: string
  messageHandler: (message: WsMessage) => ProviderResult<{
    Parameters: typeof inputParameters.definition
    Response: Response
  }>[]
}) => {
  return new WebSocketTransport<WsTransportTypes<WsMessage, Response>>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/${apiPath}`,
    options: (_context, _desiredSubs) => {
      return {
        headers: {
          token: apiKey,
        },
      }
    },
    handlers: {
      heartbeat: (connection, _context) => {
        connection.send(
          JSON.stringify({
            ac: 'ping',
            params: Date.now().toString(),
          }),
        )
      },
      message(message) {
        return messageHandler(message)
      },
    },
    builders: {
      subscribeMessage: (params) => {
        return {
          ac: 'subscribe',
          params: [params.symbol, region.toLowerCase()].join('$'),
          types: type,
        }
      },
      unsubscribeMessage: (_params) => {
        // iTick doesn't support unsubscribing.
        // Return a ping message instead.
        return {
          ac: 'ping',
          params: Date.now().toString(),
        }
      },
    },
  })
}
