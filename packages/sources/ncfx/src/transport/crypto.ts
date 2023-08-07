import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto'
import {
  makeLogger,
  PartialAdapterResponse,
  ProviderResultGenerics,
} from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('NcfxCryptoEndpoint')

export type MultiVarResult<T extends ProviderResultGenerics> = {
  params: typeof inputParameters.validated
  response: PartialAdapterResponse<T['Response']> & {
    bid: number
    ask: number
  }
}

type WsMessage = WsInfoMessage | WsPriceMessage

type WsInfoMessage = {
  Type: string
  Message: string
}

type WsPriceMessage = {
  timestamp: string // e.g. 2023-01-31T20:10:41
  currencyPair: string // e.g. ETH/USD
  bid?: number // e.g. 1595.4999
  offer?: number // e.g. 1595.5694
  mid?: number // e.g. 1595.5346
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}
export const transport = new WebSocketTransport<WsTransportTypes>({
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
            reject(
              new Error(`Unexpected message after WS connection open: ${event.data.toString()}`),
            )
          }
        })
        // Send login payload
        logger.debug('Logging in WS connection')
        connection.send(
          JSON.stringify({
            request: 'login',
            username: context.adapterSettings.API_USERNAME,
            password: context.adapterSettings.API_PASSWORD,
          }),
        )
      })
    },

    message(message: WsMessage): MultiVarResult<WsTransportTypes>[] | undefined {
      if (isInfoMessage(message)) {
        logger.debug(`Received message ${message.Type}: ${message.Message}`)
        return
      }

      if (!message.currencyPair || !message.mid || !message.bid || !message.offer) {
        logger.debug('WS message does not contain valid data, skipping')
        return
      }

      const [base, quote] = message.currencyPair.split('/')
      return [
        {
          params: { base, quote },
          response: {
            result: message.mid || 0, // Already validated in the filter above
            bid: message.bid || 0, // Already validated in the filter above
            ask: message.offer || 0, // Already validated in the filter above
            data: {
              // bid, mid, ask included here again.
              // Also kept outside data for backward compatability
              bid: message.bid || 0,
              mid: message.mid || 0,
              ask: message.offer || 0,
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

const isInfoMessage = (message: WsMessage): message is WsInfoMessage => {
  return (message as WsInfoMessage).Type !== undefined
}
