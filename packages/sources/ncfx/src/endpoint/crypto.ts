import { customSettings } from '../config'
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
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxCryptoEndpoint')

export const cryptoTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  handlers: {
    open(connection, context) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.Message === 'Succesfully Authenticated') {
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
              providerIndicatedTime: new Date(message.timestamp).getTime(),
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

export const cryptoEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transport: cryptoTransport,
  inputParameters: priceEndpointInputParameters,
})
