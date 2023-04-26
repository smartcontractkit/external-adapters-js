import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { CryptoEndpointTypes } from '../crypto-utils'

const logger = makeLogger('CryptoCompare WS')

interface WSSuccessType {
  PRICE?: number // Cryptocompare does not provide the price in updates from all exchanges
  TYPE: string
  MARKET: string
  FLAGS: number
  FROMSYMBOL: string
  TOSYMBOL: string
  VOLUMEDAY: number
  VOLUME24HOUR: number
  VOLUMEDAYTO: number
  VOLUME24HOURTO: number
  MESSAGE?: string
}

interface WSErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

export type WsMessage = WSSuccessType | WSErrorType

type WsEndpointTypes = CryptoEndpointTypes & {
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
          if (parsed.MESSAGE === 'STREAMERWELCOME') {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },
    message(message): ProviderResult<WsEndpointTypes>[] {
      logger.trace(message, 'Got response from websocket')

      if (message.MESSAGE === 'INVALID_SUB') {
        // message.PARAMETER looks like 5~CCCAGG~BASE~QUOTE
        const parameters = (message as WSErrorType).PARAMETER.split('~')
        const base = parameters[2]
        const quote = parameters[3]
        logger.error(message, 'asset not supported by data provider')
        return [
          {
            params: { base, quote },
            response: {
              errorMessage: `Requested asset - ${base}/${quote} is not supported or there is no price for it.`,
              statusCode: 502,
            },
          },
        ]
      }

      if (message.TYPE === '5' && !('PRICE' in message)) {
        // message.PARAMETER looks like 5~CCCAGG~BASE~QUOTE
        const parameters = (message as WSErrorType).PARAMETER.split('~')
        const base = parameters[2]
        const quote = parameters[3]
        logger.error(message, 'price not provided')
        return [
          {
            params: { base, quote },
            response: {
              errorMessage: `Cryptocompare provided no price data for ${base}/${quote}`,
              statusCode: 502,
            },
          },
        ]
      }

      if (message.TYPE === '5') {
        message = message as WSSuccessType
        return [
          {
            params: { base: message.FROMSYMBOL, quote: message.TOSYMBOL },
            response: {
              result: message.PRICE as number,
              data: {
                result: message.PRICE as number,
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
      return { action: 'SubAdd', subs: [`5~CCCAGG~${params.base}~${params.quote}`.toUpperCase()] }
    },
    unsubscribeMessage: (params) => {
      return {
        action: 'SubRemove',
        subs: [`5~CCCAGG~${params.base}~${params.quote}`.toUpperCase()],
      }
    },
  },
})
