import { BaseEndpointTypes } from '../endpoint/vwap'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  BaseMessage,
  VwapUpdate,
  blocksizeDefaultUnsubscribeMessageBuilder,
  blocksizeDefaultWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  handlePriceUpdates,
} from './utils'

const logger = makeLogger('BlocksizeCapitalVwapWebsocketEndpoint')

// On subscription to Blocksize-Capital WS API, the initial response is sent as a
// snapshot (in result.snapshot) of the most recent data.
// Subsequent responses are sent as notifications in params.updates
export interface FixedVwapMessage extends BaseMessage {
  method?: 'fixedvwap'
  params?: {
    updates: VwapUpdate[]
  }
  result?: {
    snapshot: VwapUpdate[]
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: FixedVwapMessage
  }
}

const preProcessFixedVwapMessage = (message: FixedVwapMessage): VwapUpdate[] => {
  let updates: VwapUpdate[] = []
  if (!message.method && message.result?.snapshot?.length) {
    updates = message.result.snapshot
  } else if (message.method === 'fixedvwap' && message.params) {
    updates = message.params.updates
  } else {
    logger.info(`Received unexpected message: ${message}`)
  }
  return updates
}

export const transport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      open: (connection, context) =>
        blocksizeDefaultWebsocketOpenHandler(connection, context.adapterSettings.API_KEY),
      message: (message) => {
        const updates = preProcessFixedVwapMessage(message)
        return handlePriceUpdates(updates, transport)
      },
    },
    builders: {
      subscribeMessage: (params) => {
        const pair = `${params.base}${params.quote}`.toUpperCase()
        transport.setReverseMapping(pair, params)
        return buildBlocksizeWebsocketTickersMessage('fixedvwap_subscribe', pair)
      },
      unsubscribeMessage: (params) =>
        blocksizeDefaultUnsubscribeMessageBuilder(
          params.base,
          params.quote,
          'fixedvwap_unsubscribe',
        ),
    },
  })
