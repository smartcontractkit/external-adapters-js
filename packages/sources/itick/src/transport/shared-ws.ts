import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, ResponseGenerics } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { inputParameters } from '../endpoint/shared'

type WsMessageBase = {
  data: {
    type: string
  }
}

type WsTransportTypes<Message, Response extends ResponseGenerics> = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: Response
  Provider: { WsMessage: Message & WsMessageBase }
}

export const createWsTransport = <Message, Response extends ResponseGenerics>({
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
  messageHandler: (message: Message) => ProviderResult<{
    Parameters: typeof inputParameters.definition
    Response: Response
  }>[]
}) => {
  return new WebSocketTransport<WsTransportTypes<Message, Response>>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/${apiPath}`,
    options: (_context, _desiredSubs) => {
      return {
        headers: {
          token: apiKey,
        },
      }
    },
    handlers: {
      // This sends a heartbeat every 10 seconds, unless the interval is
      // changed via WS_HEARTBEAT_INTERVAL_MS.
      heartbeat: (connection, _context) => {
        connection.send(
          JSON.stringify({
            ac: 'ping',
            params: Date.now().toString(),
          }),
        )
      },
      message(message) {
        if (message.data.type != type) {
          return
        }
        return messageHandler(message)
      },
    },
    builders: {
      subscribeMessage: (params) => {
        return {
          ac: 'subscribe',
          params: [params.base, region.toLowerCase()].join('$'),
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
