import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/vwap'
import {
  BaseMessage,
  VwapUpdate,
  blocksizeDefaultWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  buildTicker,
  handlePriceUpdates,
} from './utils'

const logger = makeLogger('BlocksizeCapitalVwapWebsocketEndpoint')

interface FixedVwapSnapshot extends BaseMessage {
  result: {
    snapshot: VwapUpdate[]
  }
}

interface FixedVwapUpdate extends BaseMessage {
  method: 'fixedvwap'
  params: {
    updates: VwapUpdate[]
  }
}

// On subscription to Blocksize-Capital WS API, the initial response is sent as a
// snapshot (in result.snapshot) of the most recent data.
// Subsequent responses are sent as notifications in params.updates
export type FixedVwapMessage = FixedVwapSnapshot | FixedVwapUpdate

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: FixedVwapMessage
  }
}

const preProcessFixedVwapMessage = (message: FixedVwapMessage): VwapUpdate[] => {
  let updates: VwapUpdate[] = []
  if ('result' in message) {
    updates = message.result.snapshot
  } else if ('method' in message && message.method === 'fixedvwap' && message.params) {
    updates = message.params.updates
  } else {
    logger.info(`Received unexpected message: ${JSON.stringify(message)}`)
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
      batchSubscribeMessage: (params) => {
        const pairsWithParams = params.map((param) => ({ pair: buildTicker(param), param }))
        pairsWithParams.forEach(({ pair, param }) => transport.setReverseMapping(pair, param))
        return buildBlocksizeWebsocketTickersMessage(
          'fixedvwap_subscribe',
          pairsWithParams.map(({ pair }) => pair),
        )
      },
      batchUnsubscribeMessage: (params) => {
        const pairs = params.map((param) => buildTicker(param))
        return buildBlocksizeWebsocketTickersMessage('fixedvwap_unsubscribe', pairs)
      },
    },
  })
