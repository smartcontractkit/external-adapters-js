import { BaseEndpointTypes } from '../endpoint/price'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  BaseMessage,
  blocksizeDefaultUnsubscribeMessageBuilder,
  blocksizeDefaultWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  handlePriceUpdates,
  VwapUpdate,
} from './utils'

const logger = makeLogger('BlocksizeCapitalTransportPrice')

export interface PriceMessage extends BaseMessage {
  result?: {
    snapshot: string[]
  }
}

export interface VwapMessage extends PriceMessage {
  method: 'vwap'
  params: {
    updates: VwapUpdate[]
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: VwapMessage
  }
}

export const transport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      open: (connection, context) =>
        blocksizeDefaultWebsocketOpenHandler(connection, context.adapterSettings.API_KEY),
      message: (message) => {
        if (message.method !== 'vwap') {
          if (message?.result?.snapshot && JSON.stringify(message.result.snapshot) === '[]') {
            logger.error(`Pair does not exist`)
            logger.warn(`Possible Solutions:
              1. Confirm you are using the same symbol found in the job spec with the correct case.
              2. There maybe an issue with the job spec or the Data Provider may have delisted the asset. Reach out to Chainlink Labs.`)
          }
          return []
        }
        const updates = message.params.updates
        return handlePriceUpdates(updates, transport)
      },
    },
    builders: {
      subscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        transport.setReverseMapping(pair, params)
        return buildBlocksizeWebsocketTickersMessage('vwap_subscribe', pair)
      },
      unsubscribeMessage: (params) =>
        blocksizeDefaultUnsubscribeMessageBuilder(params.base, params.quote, 'vwap_unsubscribe'),
    },
  })
