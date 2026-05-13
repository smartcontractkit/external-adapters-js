import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { PriceCache } from './price-cache'

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

const logger = makeLogger('PriceTransport')
const PONG_TIMEOUT = 2000

// Track when the last ping is send
let pingTime = Date.now()
// Prevent sending duplicate streamId to server
const activeStreamIds = new Set<string>()
// We may get bid and ask updates in two seperate messages
const cache = new PriceCache()

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,

  options: (context) => ({
    cert: context.adapterSettings.PUBLIC_CERT,
    key: context.adapterSettings.PRIVATE_KEY,
  }),

  handlers: {
    open() {
      activeStreamIds.clear()
    },
    heartbeat(connection) {
      connection.ping()
      pingTime = Date.now()
    },
    pong(connection) {
      const pongTime = Date.now() - pingTime
      if (pongTime > PONG_TIMEOUT) {
        logger.error(`Pong received ${pongTime}ms after ping exceeding ${PONG_TIMEOUT}ms timeout`)
        connection.close(1006, 'The connection appears to be active but stopped receiving updates')
      }
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
            return ['stock', 'stock_quotes'].map((rawEndpoint) => ({
              params: { base: stream.streamId, rawEndpoint },
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
