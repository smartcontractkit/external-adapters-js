import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import WebSocket from 'ws'
import { BaseEndpointTypes } from '../endpoint/state'
import { createCustomLogger } from './Logger'
// import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  blocksizeDefaultUnsubscribeMessageBuilder,
  blocksizeStateWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  clearOutOfOrderDetector,
  processStateData,
  StateData,
} from './utils'

const logger = createCustomLogger('StateTransport') //makeLogger('StateTransport')

interface BlocksizeMessage {
  jsonrpc: string
  id?: number
  method?: string
  params?: any
  result?: any
  error?: any
}

interface StateMessage extends BlocksizeMessage {
  method: 'state'
  params: {
    states: StateData[]
  }
}

type WSMessage = BlocksizeMessage | StateMessage

export interface TransportTypes extends BaseEndpointTypes {
  Provider: {
    WsMessage: WSMessage
  }
}

type RequestParams = { base: string; quote: string }

export const stateTransport = new WebSocketTransport<TransportTypes>({
  url: (context: EndpointContext<TransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,

  handlers: {
    message(message: WSMessage) {
      // logger.debug('Raw WebSocket message received:', JSON.stringify(message, null, 2))

      if (!message || typeof message !== 'object') return []

      // Subscription snapshot
      if (message.id !== undefined && message.result?.snapshot) {
        logger.info(
          `Subscription snapshot received (request ${message.id}): ${message.result.snapshot.length} items`,
        )

        if (message.result.snapshot.length === 0) {
          logger.error(`Pair does not exist for subscription ${message.id}`)
          logger.warn(`Possible Solutions:
            1. Confirm you are using the same symbol found in the job spec with the correct case
            2. Verify the ticker format matches Blocksize Capital's requirements (e.g., CBBTCUSD, ALETHUSD)
            3. There may be an issue with the job spec or the Data Provider may have delisted the asset. Reach out to Chainlink Labs.`)
          logger.debug(JSON.stringify(message, null, 2))
          return []
        }
        return message.result.snapshot.flatMap((state: StateData) => processStateData(state, false))
      }

      // Streaming state updates
      if (message.method === 'state' && message.params?.states) {
        const results = message.params.states.flatMap((state: StateData) =>
          processStateData(state, true),
        )
        logger.debug(JSON.stringify(message))
        return results
      }

      if (message.error) {
        logger.error(`Error (request ${message.id}):`, message.error)
        logger.debug(JSON.stringify(message))
      }

      return []
    },

    open: (connection, context) =>
      blocksizeStateWebsocketOpenHandler(connection, context.adapterSettings.API_KEY),
    close(event: WebSocket.CloseEvent) {
      logger.info(`WebSocket closed: ${event.code} - ${event.reason}`)
      clearOutOfOrderDetector()
    },
    error(errorEvent: WebSocket.ErrorEvent) {
      logger.error(`WebSocket error: ${errorEvent.message}`)
    },
  },

  builders: {
    subscribeMessage: (params: RequestParams) => {
      const ticker = `${params.base}${params.quote}`.toUpperCase()
      return buildBlocksizeWebsocketTickersMessage('state_subscribe', ticker)
    },
    unsubscribeMessage: (params: RequestParams) => {
      return blocksizeDefaultUnsubscribeMessageBuilder(
        params.base,
        params.quote,
        'state_unsubscribe',
      )
    },
  },
})
