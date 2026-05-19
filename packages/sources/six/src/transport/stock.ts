import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock'
import { StockCache } from './stock-cache'

export type Message = DataMessage | ErrorMessage

export interface PriceMessage {
  value?: number
  size?: number
  unixTimestamp?: number
}

interface DataMessage {
  data: {
    startStream: {
      type: string
      streamId: string
      last?: PriceMessage
      bestBid?: PriceMessage
      bestAsk?: PriceMessage
    }[]
  }
}

interface ErrorMessage {
  errors: {
    message: string
    messageCode: number
    category: string
    type: string
  }[]
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}

const logger = makeLogger('StockTransport')
const PONG_TIMEOUT = 2000

let pongWaitTimer: ReturnType<typeof setTimeout> | undefined
function clearPongWaitTimer() {
  if (pongWaitTimer !== undefined) {
    clearTimeout(pongWaitTimer)
    pongWaitTimer = undefined
  }
}

// Prevent sending duplicate streamId to server
const activeStreamIds = new Set<string>()
// We may get bid and ask updates in two seperate messages
const cache = new StockCache()

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,

  options: (context) => ({
    cert: context.adapterSettings.PUBLIC_CERT,
    key: context.adapterSettings.PRIVATE_KEY,
  }),

  handlers: {
    open() {
      clearPongWaitTimer()
      activeStreamIds.clear()
    },
    close() {
      clearPongWaitTimer()
    },
    heartbeat(connection) {
      if (pongWaitTimer) {
        clearPongWaitTimer()
        connection.close(
          1006,
          `Heartbeat frequency exceeded ${PONG_TIMEOUT}ms, increase WS_HEARTBEAT_INTERVAL_MS in environment variable`,
        )
      } else {
        connection.ping()
        pongWaitTimer = setTimeout(() => {
          pongWaitTimer = undefined
          logger.error(`Pong not received within ${PONG_TIMEOUT}ms after ping; closing connection`)
          connection.close(
            1006,
            'The connection appears to be active but stopped receiving updates',
          )
        }, PONG_TIMEOUT)
      }
    },
    pong() {
      clearPongWaitTimer()
    },
    message(message) {
      if ('errors' in message) {
        logger.error({ errors: message.errors }, 'SIX API returned errors')
        return []
      }

      return message.data.startStream
        .map((stream) => {
          const [ticker, market] = stream.streamId.split('_')
          if (!ticker || !market) {
            logger.warn(`Unexpected streamId format ${stream.streamId}`)
            return []
          }
          if (stream.type === 'ERROR') {
            return (['stock', 'stock_quotes'] as const).map((type) => ({
              params: { base: stream.streamId, type },
              response: {
                statusCode: 502,
                errorMessage: `Data Provider returned error for this request`,
              },
            }))
          }

          if (stream.type === 'START' || stream.type === 'UPDATE') {
            cache.processBidAsk(stream.streamId, stream.bestBid, stream.bestAsk)
            return [
              ...cache.getPriceResponse(stream.streamId, stream.last),
              ...cache.getBidAskResponse(stream.streamId),
            ]
          }
          logger.debug(`Ignore message ${stream}`)
          return []
        })
        .flat()
    },
  },

  builders: {
    subscribeMessage: (params) => {
      if (activeStreamIds.has(params.base)) {
        return undefined
      }
      activeStreamIds.add(params.base)

      return {
        query: `subscription {
        startStream(
          scheme: TICKER_BC,
          ids: ["${params.base}"],
          streamId: "${params.base}",
          conflationType: INTERVAL,
          conflationPeriod: "PT1S"
        ) {
          type
          requestedId
          streamId
          last { value unixTimestamp }
          bestBid { value size unixTimestamp }
          bestAsk { value size unixTimestamp }
          mid { value unixTimestamp }
        }
      }`,
      }
    },
    unsubscribeMessage: (params) => {
      activeStreamIds.delete(params.base)
      return {
        query: `mutation { closeStream(streamId: "${params.base}") { type streamId } }`,
      }
    },
  },
})
