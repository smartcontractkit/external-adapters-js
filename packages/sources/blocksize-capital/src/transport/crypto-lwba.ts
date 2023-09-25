import { BaseEndpointTypes } from '../endpoint/crypto-lwba'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseMessage, blocksizeDefaultWebsocketOpenHandler } from './transportutils'

const logger = makeLogger('BlocksizeCapitalLwbaWebsocketEndpoint')

export interface Message extends BaseMessage {
  method: 'bidask'
  params: {
    updates: {
      ticker: string
      agg_ask_price: string
      agg_ask_size: string
      agg_bid_price: string
      agg_bid_size: string
      agg_mid_price: string
      ts: string
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
      open: blocksizeDefaultWebsocketOpenHandler,
      message: (message) => {
        if (message.method !== 'bidask') return []
        const updates = message.params.updates
        const results: ProviderResult<WsTransportTypes>[] = []
        for (const update of updates) {
          const params = transport.getReverseMapping(update.ticker)
          if (!params) {
            continue
          }
          if (!update.agg_ask_price || !update.agg_bid_price || !update.agg_mid_price) {
            const errorMessage = `The data provider bid/ask update is incomplete for ${params.base}/${params.quote}`
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
                result: null,
                data: {
                  ask: Number(update.agg_ask_price),
                  bid: Number(update.agg_bid_price),
                  mid: Number(update.agg_mid_price),
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: Number(update.ts),
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
          method: 'bidask_subscribe',
          params: { tickers: [pair] },
        }
      },

      unsubscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        return {
          jsonrpc: '2.0',
          method: 'bidask_subscribe',
          params: { tickers: [pair] },
        }
      },
    },
  })
