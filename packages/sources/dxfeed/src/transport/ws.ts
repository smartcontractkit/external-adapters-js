import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'

const logger = makeLogger('DxFeed Websocket')

type DXFeedMessage = {
  channel: string
  clientId?: string
  id: string
  data: [
    string,
    [
      string,
      number,
      number,
      number,
      number,
      string,
      number,
      string,
      number,
      number,
      number,
      number,
    ],
  ]
  successful?: boolean
  advice?: {
    interval: number
    timeout: number
    reconnect: string
  }
}[]

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

type ProviderTypes = {
  Provider: {
    WsMessage: DXFeedMessage
  }
}

const META_HANDSHAKE = '/meta/handshake'
const META_CONNECT = '/meta/connect'
const SERVICE_SUB = '/service/sub'
const SERVICE_DATA = '/service/data'

class DxFeedWebsocketTransport<T extends BaseTransportTypes> extends WebSocketTransport<
  T & ProviderTypes
> {
  private _connectionClientId = ''
  id = 0

  get connectionClientId() {
    return this._connectionClientId
  }

  set connectionClientId(id) {
    this._connectionClientId = id
  }

  get handshakeMsg() {
    return [
      {
        id: ++this.id,
        version: '1.0',
        minimumVersion: '1.0',
        channel: META_HANDSHAKE,
        supportedConnectionTypes: ['websocket', 'long-polling', 'callback-polling'],
        advice: {
          timeout: 60000,
          interval: 0,
        },
      },
    ]
  }

  get firstHeartbeatMsg() {
    return [
      {
        id: ++this.id,
        clientId: this.connectionClientId,
        channel: META_CONNECT,
        connectionType: 'websocket',
        advice: {
          timeout: 60000,
        },
      },
    ]
  }

  get heartbeatMsg() {
    return [
      {
        id: ++this.id,
        clientId: this.connectionClientId,
        channel: META_CONNECT,
        connectionType: 'websocket',
      },
    ]
  }
}

export function buildWsTransport<T extends BaseTransportTypes>(
  formatTicker: (
    base: TypeFromDefinition<(T & ProviderTypes)['Parameters']>,
  ) => Record<string, string[]>,
  processMessage: (message: DXFeedMessage) => ProviderResult<T & ProviderTypes>[],
): WebSocketTransport<T & ProviderTypes> {
  const wsTransport: DxFeedWebsocketTransport<T> = new DxFeedWebsocketTransport({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    handlers: {
      open(connection) {
        return new Promise((resolve) => {
          connection.addEventListener('message', (event: MessageEvent) => {
            const message: DXFeedMessage[0] = JSON.parse(event.data.toString())[0]
            if (message.clientId && message.channel === '/meta/handshake') {
              wsTransport.connectionClientId = message.clientId
              connection.send(JSON.stringify(wsTransport.firstHeartbeatMsg))
            }

            if (message.channel === '/meta/connect') {
              connection.send(JSON.stringify(wsTransport.heartbeatMsg))
              resolve()
            }
          })

          connection.send(JSON.stringify(wsTransport.handshakeMsg))
        })
      },
      message(message) {
        // If dxfeed errors there is no information about failed feeds/params in the message, returning empty array. We need strict comparison because dxfeed sends info messages also that don't contain `successful` property.
        if (message[0].successful === false) {
          logger.warn(`Dxfeed returned unsuccessful message: ${JSON.stringify(message[0])}`)
          return []
        }

        if (!Array.isArray(message) || message[0].channel !== SERVICE_DATA) {
          return []
        }

        return processMessage(message)
      },
    },

    builders: {
      subscribeMessage: (params) => {
        return [
          {
            channel: SERVICE_SUB,
            data: { add: formatTicker(params) },
            clientId: wsTransport.connectionClientId,
          },
        ]
      },
      unsubscribeMessage: (params) => {
        return [
          {
            channel: SERVICE_SUB,
            data: { remove: formatTicker(params) },
            clientId: wsTransport.connectionClientId,
          },
        ]
      },
    },
  })

  return wsTransport
}
