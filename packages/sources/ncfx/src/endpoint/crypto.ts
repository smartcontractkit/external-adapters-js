import {
  CryptoPriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

type WsMessage = {
  timestamp: string
  currencyPair: string
  bid?: number
  offer?: number
  mid?: number
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxCryptoEndpoint')

export const cryptoTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  handlers: {
    open(connection, context) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.addEventListener('message', (event: MessageEvent) => {
          const parsed = JSON.parse(event.data.toString())
          if (parsed.Message === 'Successfully Authenticated') {
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
            username: context.adapterSettings.API_USERNAME,
            password: context.adapterSettings.API_PASSWORD,
          }),
        )
      })
    },

    message(message: WsMessage): ProviderResult<EndpointTypes>[] {
      if (!message.currencyPair || !message.mid) {
        logger.debug('WS message does not contain valid data, skipping')
        return []
      }

      const [base, quote] = message.currencyPair.split('/')
      return [
        {
          params: { base, quote },
          response: {
            result: message.mid || 0, // Already validated in the filter above
            data: {
              result: message.mid || 0, // Already validated in the filter above
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.timestamp).getTime(),
            },
          },
        },
      ]
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

export const cryptoEndpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transport: cryptoTransport,
  inputParameters: priceEndpointInputParameters,
})
