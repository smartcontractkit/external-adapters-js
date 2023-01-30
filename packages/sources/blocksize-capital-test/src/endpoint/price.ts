import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  WebsocketReverseMappingTransport,
  WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports/websocket'
import {
  PriceEndpoint,
  PriceEndpointParams,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
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

const inputParameters: PriceEndpointInputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message[]
  }
}

export class BlocksizeWebsocketReverseMappingTransport<
  T extends WebsocketTransportGenerics,
  K,
> extends WebsocketReverseMappingTransport<T, K> {
  api_key = ''
}

export const websocketTransport: BlocksizeWebsocketReverseMappingTransport<EndpointTypes, string> =
  new BlocksizeWebsocketReverseMappingTransport<EndpointTypes, string>({
    url: ({ adapterConfig: { WS_API_ENDPOINT, API_KEY } }) => {
      websocketTransport.api_key = API_KEY
      return WS_API_ENDPOINT
    },
    handlers: {
      open: (connection) => {
        connection.send({
          jsonrpc: '2.0',
          method: 'authentication_logon',
          params: { api_key: websocketTransport.api_key },
        })
      },
      message: (message) => {
        if (Object.keys(message).length === 0) {
          logger.debug('WS message is empty, skipping')
          return []
        }
        const [_, msg] = message
        if (!('method' in msg) || msg.method !== 'vwap') return []
        const [updates] = msg.params.updates
        const params = websocketTransport.getReverseMapping(updates.ticker)
        if (!params) {
          return []
        }

        if (!updates.price) {
          logger.error(`The data provider didn't return any value`)
          return []
        }

        return [
          {
            params,
            response: {
              result: updates.price,
              data: {
                result: updates.price,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(Date.now()).getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        websocketTransport.setReverseMapping(pair, params)
        return {
          jsonrpc: '2.0',
          method: 'vwap_subscribe',
          params: { tickers: [pair] },
        }
      },

      unsubscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        return {
          jsonrpc: '2.0',
          method: 'vwap_unsubscribe',
          params: { tickers: [pair] },
        }
      },
    },
  })

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: websocketTransport,
  inputParameters,
})
