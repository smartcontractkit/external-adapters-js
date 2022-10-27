import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'
import {
  ProviderResult,
  makeLogger,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { DEFAULT_WS_API_ENDPOINT } from '../config'
import { cryptoInputParams } from '../crypto-utils'
import { CryptoEndpointParams } from './crypto'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'

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

const logger = makeLogger('CryptoCompareCryptoEndpoint')

type CryptoWsEndpointTypes = {
  Request: {
    Params: CryptoEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: SettingsMap
  Provider: {
    WsMessage: WsMessage
  }
}

export const transport = new WebSocketTransport<CryptoWsEndpointTypes>({
  url: (context) => `${DEFAULT_WS_API_ENDPOINT}?api_key=${context.adapterConfig.API_KEY}`,
  handlers: {
    open(connection) {
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
    message(message): ProviderResult<CryptoWsEndpointTypes>[] | undefined {
      logger.trace(message, 'Got response from websocket')
      if (message.TYPE === '5' && 'PRICE' in message) {
        return [
          {
            params: { base: message.FROMSYMBOL, quote: message.TOSYMBOL },
            value: message.PRICE as number,
          },
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
    subscribeMessage: (params) => {
      return { action: 'SubAdd', subs: [`5~CCCAGG~${params.base}~${params.quote}`] }
    },
    unsubscribeMessage: (params) => {
      return { action: 'SubRemove', subs: [`5~CCCAGG~${params.base}~${params.quote}`] }
    },
  },
})

export const endpoint = new PriceEndpoint({
  name: 'crypto-ws',
  transport,
  inputParameters: cryptoInputParams,
})
