import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/state'
import {
  blocksizeStateWebsocketOpenHandler,
  buildBlocksizeWebsocketTickersMessage,
  processStateData,
  StateData,
} from './utils'

const logger = makeLogger('StateTransport')

// JSON-RPC 2.0 message structure used by Blocksize Capital WebSocket API
// Used for both authentication and subscription/streaming messages
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

// Handle subscription snapshot response
// Provider sends initial snapshot upon successful subscription
function handleSubscriptionSnapshot(message: BlocksizeMessage): any[] {
  // Validate snapshot structure
  if (!message.result?.snapshot || !Array.isArray(message.result.snapshot)) {
    logger.warn(`Invalid snapshot structure for subscription ${message.id}`)
    return []
  }

  logger.info(
    `Subscription snapshot received (request ${message.id}): ${message.result.snapshot.length} items`,
  )

  if (message.result.snapshot.length === 0) {
    logger.warn(
      `Pair does not exist for subscription ${message.id}. Verify ticker format matches provider requirements or check if asset is supported`,
    )
    return []
  }

  // Validate each state data item in snapshot
  const validStates = message.result.snapshot.filter((state: any) => {
    if (!state || typeof state !== 'object' || !state.base_symbol || !state.quote_symbol) {
      logger.warn(`Invalid state data in snapshot: ${JSON.stringify(state)}`)
      return false
    }
    return true
  })

  return validStates.flatMap((state: StateData) => processStateData(state))
}

// Handle streaming state updates
function handleStreamingUpdates(message: StateMessage): any[] {
  logger.debug(JSON.stringify(message))
  return message.params.states.flatMap((state: StateData) => processStateData(state))
}

export const stateTransport = new WebSocketTransport<TransportTypes>({
  url: (context: EndpointContext<TransportTypes>) => context.adapterSettings.WS_API_ENDPOINT,

  handlers: {
    message(message: WSMessage) {
      if (!message || typeof message !== 'object') return []

      // Subscription snapshot
      if (message.id !== undefined && message.result?.snapshot) {
        return handleSubscriptionSnapshot(message)
      }

      // Streaming state updates
      if (message.method === 'state' && message.params?.states) {
        return handleStreamingUpdates(message as StateMessage)
      }

      return []
    },

    open: (connection, context) =>
      blocksizeStateWebsocketOpenHandler(connection, {
        api_key: context.adapterSettings.API_KEY,
      }),
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
