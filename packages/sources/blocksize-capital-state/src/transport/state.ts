import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import type { WebSocket } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/state'
import {
  blocksizeStateWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  processStateData,
  StateData,
} from './utils'

const logger = makeLogger('StateTransport')

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
      if (!message || typeof message !== 'object') return []

      // Subscription snapshot
      if (message.id !== undefined && message.result?.snapshot) {
        logger.info(
          `Subscription snapshot received (request ${message.id}): ${message.result.snapshot.length} items`,
        )

        if (message.result.snapshot.length === 0) {
          logger.error(`Pair does not exist for subscription ${message.id}`)
          logger.warn(
            'Verify ticker format matches provider requirements or check if asset is supported',
          )
          logger.debug(JSON.stringify(message, null, 2))
          return []
        }
        return message.result.snapshot.flatMap((state: StateData) => processStateData(state, false))
      }

      // Streaming state updates
      if (message.method === 'state' && message.params?.states) {
        logger.debug(JSON.stringify(message))
        const results = message.params.states.flatMap((state: StateData) =>
          processStateData(state, true),
        )
        return results
      }

      if (message.error) {
        logger.error(`Error (request ${message.id}):`, message.error)
        logger.debug(JSON.stringify(message))
      }

      return []
    },

    open: (connection, context) =>
      blocksizeStateWebsocketOpenHandler(connection, {
        api_key: context.adapterSettings.API_KEY,
        token: context.adapterSettings.TOKEN,
      }),
    close(event: WebSocket.CloseEvent) {
      logger.info(`WebSocket closed: ${event.code} - ${event.reason}`)
    },
    error(errorEvent: WebSocket.ErrorEvent) {
      logger.error(`WebSocket error: ${errorEvent.message}`)
    },
  },

  builders: {
    subscribeMessage: (params: RequestParams) => {
      const ticker = `${params.base}${params.quote}`.toUpperCase()
      return buildBlocksizeWebsocketTickersMessage('state_subscribe', { tickers: [ticker] })
    },
    unsubscribeMessage: (params: RequestParams) => {
      const ticker = `${params.base}${params.quote}`.toUpperCase()
      return buildBlocksizeWebsocketTickersMessage('state_unsubscribe', { tickers: [ticker] })
    },
  },
})
