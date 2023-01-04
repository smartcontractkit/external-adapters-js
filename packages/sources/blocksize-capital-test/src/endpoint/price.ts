import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings } from '../config'

const logger = makeLogger('BlocksizeCapitalWebsocketEndpoint')
interface BaseMessage {
  jsonrpc: string
  id?: string | number | null
}

export interface Message extends BaseMessage {
  method: 'vwap'
  params: {
    updates: {
      ticker: string
      price?: number
      size?: number
      volume?: number
    }[]
  }
}

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
  Request: {
    Params: { base: string; quote: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message[]
  }
}

let api_key: string

export const makeWsTransport = new WebSocketTransport<EndpointTypes>({
  url: ({ adapterConfig: { WS_API_ENDPOINT, API_KEY } }) => {
    api_key = API_KEY
    return WS_API_ENDPOINT
  },
  handlers: {
    open: (connection) => {
      connection.send({
        jsonrpc: '2.0',
        method: 'authentication_logon',
        params: { api_key },
      })
      return Promise.resolve()
    },
    message: (message) => {
      if (Object.keys(message).length === 0) {
        logger.debug('WS message is empty, skipping')
        return []
      }
      const [_, msg] = message
      if (!(msg.method === 'vwap' || 'method' in msg)) return []
      const [updates] = msg.params.updates
      const base = updates.ticker.substring(0, 3)
      const quote = updates.ticker.substring(3)
      return [
        {
          params: { base, quote },
          response: {
            result: updates.price as number,
            data: {
              result: updates.price as number,
            },
            timestamps: {
              providerIndicatedTime: new Date(Date.now()).getTime(),
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (input) => {
      return {
        jsonrpc: '2.0',
        method: 'vwap_subscribe',
        params: { tickers: [`${input.base}${input.quote}`] },
      }
    },

    unsubscribeMessage: (input) => {
      return {
        jsonrpc: '2.0',
        method: 'vwap_unsubscribe',
        params: { tickers: [`${input.base}${input.quote}`] },
      }
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: makeWsTransport,
  inputParameters,
})
