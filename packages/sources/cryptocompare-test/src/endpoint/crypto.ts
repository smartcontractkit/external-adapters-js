import {
  AdapterContext,
  PriceEndpoint,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketRawData,
  WebSocket,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { DEFAULT_WS_API_ENDPOINT } from '../config'

export const cryptoInputParams = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
} as const

interface Message {
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

export interface WSErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

const logger = makeLogger('CryptoCompareCryptoEndpoint')

export const transport = new WebSocketTransport({
  url: (context: AdapterContext) =>
    `${DEFAULT_WS_API_ENDPOINT}?api_key=${context.adapterConfig.API_KEY}`,
  handlers: {
    open(connection: WebSocket) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.MESSAGE === 'STREAMERWELCOME') {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },
    message(message: Message): ProviderResult<PriceEndpointParams>[] | undefined {
      logger.trace(message, 'Got response from websocket')
      if (message.TYPE === '5' && 'PRICE' in message) {
        return [
          { params: { base: message.FROMSYMBOL, quote: message.TOSYMBOL }, value: message.PRICE },
        ]
      }
      if (message.MESSAGE === 'INVALID_SUB') {
        logger.error(message, 'asset not supported by data provider')
        return
      }
      return
    },
  },
  builders: {
    subscribeMessage: (params: PriceEndpointParams) => {
      return { action: 'SubAdd', subs: [`5~CCCAGG~${`${params.base}~${params.quote}`}`] }
    },
    unsubscribeMessage: (params: PriceEndpointParams) => {
      return { action: 'SubRemove', subs: [`5~CCCAGG~${`${params.base}~${params.quote}`}`] }
    },
  },
})

export const endpoint = new PriceEndpoint({
  name: 'crypto',
  transport,
  inputParameters: cryptoInputParams,
})
