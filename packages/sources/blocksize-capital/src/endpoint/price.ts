import {
  CryptoPriceEndpoint,
  EndpointContext,
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

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
      ts: number
    }[]
  }
}

const inputParameters = {
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
} satisfies PriceEndpointInputParameters

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: Message
  }
}

export const websocketTransport: WebsocketReverseMappingTransport<EndpointTypes, string> =
  new WebsocketReverseMappingTransport<EndpointTypes, string>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => {
      return WS_API_ENDPOINT
    },
    handlers: {
      open: (connection: WebSocket, context: EndpointContext<EndpointTypes>) => {
        return new Promise((resolve, reject) => {
          connection.addEventListener('message', (event: MessageEvent<any>) => {
            const parsed = JSON.parse(event.data.toString())
            if (parsed.result?.user_id) {
              logger.debug('Got logged in response, connection is ready')
              resolve()
            } else {
              reject(new Error('Failed to make WS connection'))
            }
          })
          const options = {
            jsonrpc: '2.0',
            method: 'authentication_logon',
            params: { api_key: context.adapterSettings.API_KEY },
          }
          connection.send(JSON.stringify(options))
        })
      },
      message: (message) => {
        if (message.method !== 'vwap') return []
        const updates = message.params.updates
        const results: ProviderResult<EndpointTypes>[] = []
        for (const update of updates) {
          const params = websocketTransport.getReverseMapping(update.ticker)
          if (!params) {
            continue
          }
          if (!update.price) {
            const errorMessage = `The data provider didn't return any value for ${params.base}/${params.quote}`
            logger.info(errorMessage)
            results.push({
              params,
              response: {
                statusCode: 502,
                errorMessage,
              },
            })
          } else {
            results.push({
              params,
              response: {
                result: update.price,
                data: {
                  result: update.price,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: update.ts,
                },
              },
            })
          }
        }
        return results
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

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['crypto'],
  transport: websocketTransport,
  inputParameters,
})
