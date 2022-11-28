import { CRYPTO_DEFAULT_BASE_WS_URL, customSettings } from '../config'
import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketRawData } from '@chainlink/external-adapter-framework/transports/websocket'

interface Change {
  period: string
  change: number
  percentage: number
}

type WsMessage = {
  timestamp: string
  currencyPair: string
  bid?: number
  offer?: number
  mid?: number
  changes: Change[]
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: WsMessage[]
  }
}

const logger = makeLogger('NcfxCryptoEndpoint')

export const cryptoTransport = new WebSocketTransport<EndpointTypes>({
  url: () => CRYPTO_DEFAULT_BASE_WS_URL,
  handlers: {
    open(connection, context) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.Message?.startsWith('Logged in as user')) {
            logger.debug('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
        // Send login payload
        connection.send(
          JSON.stringify({
            request: 'login',
            username: context.adapterConfig.API_USERNAME,
            password: context.adapterConfig.API_PASSWORD,
          }),
        )
      })
    },

    message(message: WsMessage[]): ProviderResult<EndpointTypes>[] {
      if (!Array.isArray(message)) {
        logger.debug('WS message is not array, skipping')
        return []
      }
      return message
        .filter((m) => {
          return m.mid && m.mid > 0
        })
        .map((m) => {
          const [base, quote] = m.currencyPair.split('/')
          return {
            params: { base, quote },
            response: {
              result: m.mid || 0, // Already validated in the filter above
              data: {
                result: m.mid || 0, // Already validated in the filter above
              },
              timestamps: {
                providerIndicatedTime: new Date(m.timestamp).getTime(),
              },
            },
          }
        })
    },
  },
  builders: {
    subscribeMessage: (params) => ({
      request: 'subscribe',
      ccy: `${params.base}/${params.quote}`,
    }),
    unsubscribeMessage: (params) => ({
      request: 'unsubscribe',
      ccy: `${params.base}/${params.quote}`,
    }),
  },
})

export const cryptoEndpoint = new PriceEndpoint({
  name: 'crypto',
  transport: cryptoTransport,
  inputParameters: priceEndpointInputParameters,
})
