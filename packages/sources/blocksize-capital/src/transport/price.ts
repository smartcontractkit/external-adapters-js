import { BaseEndpointTypes } from '../endpoint/price'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

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

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

export const transport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => {
      return WS_API_ENDPOINT
    },
    handlers: {
      open: (connection: WebSocket, context: EndpointContext<WsTransportTypes>) => {
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
        const results: ProviderResult<WsTransportTypes>[] = []
        for (const update of updates) {
          const params = transport.getReverseMapping(update.ticker)
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
        transport.setReverseMapping(pair, params)
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
