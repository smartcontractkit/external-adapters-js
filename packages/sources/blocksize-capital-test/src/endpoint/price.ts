import { EmptyObject, makeLogger } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings } from '../config'

interface Message {
  type: 'subscribe' | 'unsubscribe' | 'value'
  id: string
  value: string
  time: number
}
export interface WsErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

export type Params = { index?: string; base?: string; quote?: string }
type RequestParams = { Params: Params }

const inputParameters: InputParameters & PriceEndpointInputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: false,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: false,
  },
}

export type EndpointTypes = {
  Request: RequestParams
  Response: {
    Data: EmptyObject
    Result: number
  }
  CustomSettings: typeof customSettings
}

export type WsEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

const logger = makeLogger('BlocksizeCapitalWebsocketEndpoint')

export const makeWsTransport = new WebSocketTransport<WsEndpointTypes>({
  url: ({ adapterConfig: { WS_API_ENDPOINT } }) => {
    console.log('ws_endpoint', WS_API_ENDPOINT)
    return WS_API_ENDPOINT
  },
  handlers: {
    message(message) {
      logger.trace(message, 'Got response from websocket')
      if (message.type === 'value') {
        const index = message.id
        const value = Number(message.value)
        return [
          {
            params: { index },
            response: {
              result: value,
              data: {
                result: value,
              },
              timestamps: {
                providerIndicatedTime: message.time,
              },
            },
          },
        ]
      }

      return
    },
  },
  builders: {
    subscribeMessage: ({ index }) => {
      return {
        type: 'subscribe',
        id: index,
        stream: 'value',
      }
    },

    unsubscribeMessage: ({ index }) => {
      return {
        type: 'unsubscribe',
        id: index,
        stream: 'value',
      }
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: makeWsTransport,
  inputParameters,
})
