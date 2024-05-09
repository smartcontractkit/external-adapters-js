import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/utils'

const logger = makeLogger('CryptoCompare WS')

const MessageTypes = {
  // Issued when a new socket connection is made.
  SESSION_WELCOME: '4000',
  // Issued when the user sends invalid message data (not JSON) or when a user tried to remove
  // subscriptions with no assigned socket.
  STREAMER_ERROR: '4001',
  // Issued when: connections are opened too fast, we cannot validate rate limits or when a user exceeds
  // their limits.
  RATELIMIT_ERROR: '4002',
  //Issued when an unexpected error occurs or when all subscriptions are invalid.
  SUB_ERROR: '4003',
  // Issued when an invalid subscription is provided (missing keys, invalid markets, etc).
  SUB_VALIDATION_ERROR: '4004',
  // Issued when a subscription is loaded successfully.
  SUB_ACCEPTED: '4005',
  // Issued when a subscription cannot be added successfully.
  SUB_REJECTED: '4006',
  // Issued when a subscription is removed.
  SUB_REMOVE_COMPLETE: '4008',
  // Issued when a user makes a subscription and should be aware of something (e.g: instrument not
  // trading yet).
  SUB_WARNING: '4010',
  // Issued when a user provides an invalid API key and we fall back to IP rate limits
  INVALID_API_KEY: '4011',
  // Issued when a user provides a message that does not match the types above.
  INVALID_MESSAGE: '4012',
  // Heartbeat message, every 30 seconds
  HEARTBEAT_MESSAGE: '4013',
  // Issued when receiving CADLI updates
  CADLI_RESPONSE: '1101',
} as const

interface WSSuccessType {
  TYPE: (typeof MessageTypes)[keyof typeof MessageTypes]
  INSTRUMENT: string
  CCSEQ: number
  MARKET: string
  VALUE: number
  VALUE_FLAG: string
  VALUE_LAST_UPDATE_TS: number
  VALUE_LAST_UPDATE_TS_NS: number
  CURRENT_HOUR_VOLUME: number
  CURRENT_HOUR_QUOTE_VOLUME: number
  CURRENT_HOUR_VOLUME_TOP_TIER: number
  CURRENT_HOUR_QUOTE_VOLUME_TOP_TIER: number
  CURRENT_HOUR_VOLUME_DIRECT: number
  CURRENT_HOUR_QUOTE_VOLUME_DIRECT: number
  CURRENT_HOUR_VOLUME_TOP_TIER_DIRECT: number
  CURRENT_HOUR_QUOTE_VOLUME_TOP_TIER_DIRECT: number
  CURRENT_HOUR_OPEN: number
  CURRENT_HOUR_HIGH: number
  CURRENT_HOUR_LOW: number
  CURRENT_HOUR_TOTAL_INDEX_UPDATES: number
  CURRENT_HOUR_CHANGE: number
  CURRENT_HOUR_CHANGE_PERCENTAGE: number
}

interface WSErrorType {
  TYPE: (typeof MessageTypes)[keyof typeof MessageTypes]
  MESSAGE: string
  INFO: string
  SUBSCRIPTION_ID?: string
  SOCKET_ID?: string
}

export type WsMessage = WSSuccessType & WSErrorType

type WsEndpointTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const wsTransport = new WebSocketTransport<WsEndpointTypes>({
  url: (context) =>
    `${context.adapterSettings.WS_API_ENDPOINT}?api_key=${
      context.adapterSettings.WS_API_KEY || context.adapterSettings.API_KEY
    }`,
  handlers: {
    open(connection) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.addEventListener('message', (event: MessageEvent) => {
          const parsed = JSON.parse(event.data.toString())
          if (parsed.TYPE === MessageTypes.SESSION_WELCOME) {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else if (parsed.TYPE === MessageTypes.INVALID_API_KEY) {
            logger.warn(
              parsed,
              'You have connected with an invalid API key, IP address rate limits will now be applied. Please check if your key is correct',
            )
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },
    message(message): ProviderResult<WsEndpointTypes>[] {
      logger.trace(message, 'Got response from websocket')

      if (message.TYPE === MessageTypes.SUB_VALIDATION_ERROR) {
        logger.error(message, 'Assets are not supported by data provider')
        return []
      }

      if (message.INSTRUMENT && message.MARKET) {
        const [base, quote] = message.INSTRUMENT.split('-')
        return [
          {
            params: { base, quote },
            response: {
              result: message.VALUE,
              data: {
                result: message.VALUE,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: message.VALUE_LAST_UPDATE_TS * 1000,
              },
            },
          },
        ]
      }

      return []
    },
  },
  builders: {
    subscribeMessage: (params) => {
      return {
        action: 'SUB_ADD',
        type: '1101',
        groups: ['VALUE', 'CURRENT_HOUR'],
        subscriptions: [{ market: 'cadli', instrument: `${params.base}-${params.quote}` }],
      }
    },
    unsubscribeMessage: (params) => {
      return {
        action: 'SUB_REMOVE',
        type: '1101',
        groups: ['VALUE', 'CURRENT_HOUR'],
        subscriptions: [{ market: 'cadli', instrument: `${params.base}-${params.quote}` }],
      }
    },
  },
})
