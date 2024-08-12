import { BaseEndpointTypes } from '../endpoint/crypto-lwba'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  BaseMessage,
  blocksizeDefaultUnsubscribeMessageBuilder,
  blocksizeDefaultWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
} from './utils'

const logger = makeLogger('BlocksizeCapitalLwbaWebsocketEndpoint')

export interface BidAskMessage extends BaseMessage {
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
    WsMessage: BidAskMessage
  }
}

export const transport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      open: (connection, context) =>
        blocksizeDefaultWebsocketOpenHandler(connection, context.adapterSettings.API_KEY),
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
                  providerIndicatedTimeUnixMs: Math.floor(Number(update.ts) / 1000),
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
        return buildBlocksizeWebsocketTickersMessage('bidask_subscribe', pair)
      },
      unsubscribeMessage: (params) =>
        blocksizeDefaultUnsubscribeMessageBuilder(params.base, params.quote, 'bidask_unsubscribe'),
    },
  })
