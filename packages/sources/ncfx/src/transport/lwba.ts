import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypesLwba } from '../endpoint/crypto-lwba'

const logger = makeLogger('NcfxLwbaEndpoint')

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

type WsTransportTypes = BaseEndpointTypesLwba & {
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

    message(message: WsMessage) {
      if (isInfoMessage(message)) {
        logger.debug(`Received message ${message.Type}: ${message.Message}`)
        return
      }

      if (!message.currencyPair || !message.mid || !message.bid || !message.offer) {
        logger.debug('WS message does not contain valid data, skipping')
        return
      }

      // Expected timestamp in datetime format from NCFX API is missing timezone
      // Documented as UTC eg: "2023-06-06 16:03:47.750"
      const providerTime = message.timestamp.includes('Z')
        ? message.timestamp
        : `${message.timestamp}Z`
      const [base, quote] = message.currencyPair.split('/')
      return [
        {
          params: { base, quote },
          response: {
            result: null,
            data: {
              bid: message.bid || 0,
              mid: message.mid || 0,
              ask: message.offer || 0,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(providerTime).getTime(),
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
