import { CRYPTO_DEFAULT_BASE_WS_URL, customSettings } from '../config'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterContext,
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocket,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'

interface AdapterRequestParams {
  base: string
  quote: string
}

interface ProviderMessage {
  timestamp: string
  currencyPair: string
  bid?: number
  offer?: number
  mid?: number
  changes: Change[]
}

interface Change {
  period: string
  change: number
  percentage: number
}

const logger = makeLogger('NcfxCryptoEndpoint')

export const cryptoTransport = new WebSocketTransport({
  url: () => CRYPTO_DEFAULT_BASE_WS_URL,
  handlers: {
    open(connection: WebSocket, context: AdapterContext<typeof customSettings>) {
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

    message(message: ProviderMessage[]): ProviderResult<AdapterRequestParams>[] {
      if (!Array.isArray(message)) {
        logger.debug('WS message is not array, skipping')
        return []
      }
      return message.map((m) => {
        const [base, quote] = m.currencyPair.split('/')
        return {
          params: { base, quote },
          value: m.mid,
        }
      })
    },
  },
  builders: {
    subscribeMessage: (params: AdapterRequestParams) => ({
      request: 'subscribe',
      ccy: `${params.base}/${params.quote}`,
    }),
    unsubscribeMessage: (params: AdapterRequestParams) => ({
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
