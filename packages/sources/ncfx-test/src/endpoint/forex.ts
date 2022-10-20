import {
  PriceEndpoint,
  AdapterContext,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  WebSocket,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { customSettings, FOREX_DEFAULT_BASE_WS_URL } from '../config'

interface AdapterRequestParams {
  base: string
  quote: string
}

interface ProviderMessage {
  [pair: string]: { price: number; timestamp: string }
}

const logger = makeLogger('NcfxForexEndpoint')

export const forexTransport = new WebSocketTransport({
  url: () => FOREX_DEFAULT_BASE_WS_URL,
  options: (context: AdapterContext<typeof customSettings>) => {
    const forexEncodedCreds =
      context.adapterConfig.FOREX_WS_USERNAME && context.adapterConfig.FOREX_WS_PASSWORD
        ? Buffer.from(
            JSON.stringify({
              grant_type: 'password',
              username: context.adapterConfig.FOREX_WS_USERNAME,
              password: context.adapterConfig.FOREX_WS_PASSWORD,
            }),
          ).toString('base64')
        : ''
    return { headers: { ncfxauth: forexEncodedCreds } }
  },
  handlers: {
    open(connection: WebSocket, _: AdapterContext<typeof customSettings>) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (Object.keys(parsed).length > 0) {
            logger.debug('Forex connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },

    message(message: ProviderMessage): ProviderResult<AdapterRequestParams>[] {
      if (Object.keys(message).length === 0) {
        logger.debug('WS message is empty, skipping')
        return []
      }
      return Object.keys(message).map((pair) => {
        // Split forex pair with the assumption base and quote are always 3 characters long
        const base = pair.substring(0, 3)
        const quote = pair.substring(3)
        return {
          params: { base, quote },
          value: message[pair].price,
        }
      })
    },
  },
  builders: {
    subscribeMessage: (params: AdapterRequestParams) => ({
      request: 'subscribe',
      ccy: `${params.base}${params.quote}`,
    }),
    unsubscribeMessage: (params: AdapterRequestParams) => ({
      request: 'unsubscribe',
      ccy: `${params.base}${params.quote}`,
    }),
  },
})

export const forexEndpoint = new PriceEndpoint({
  name: 'forex',
  transport: forexTransport,
  inputParameters: priceEndpointInputParameters,
})
