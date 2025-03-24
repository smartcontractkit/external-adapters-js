import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/crypto'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('NcfxCryptoEndpoint')

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
      return new Promise<void>((resolve, reject) => {
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
      }).catch((error) => {
        if (
          error.message ===
          'Unexpected message after WS connection open: {"Type":"Error","Message":"Login failed, Invalid login"}'
        ) {
          logger.error(`Login failed, Invalid login`)
          logger.error(`Possible Solutions:
            1. Doublecheck your supplied credentials.
            2. Contact Data Provider to ensure your subscription is active
            3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please make contact with us and we will look into it.`)
        }
        throw error
      })
    },

    message(message: WsMessage) {
      if (isInfoMessage(message)) {
        logger.debug(`Received message ${message.Type}: ${message.Message}`)
        if (
          message.Message ===
          "Request contains pairs you don't have access to, please check the request"
        ) {
          logger.error(`Request contains pairs you don't have access to`)
          logger.error(`Possible Solutions:
            1. Confirm you are using the same symbol found in the job spec with the correct case.
            2. There maybe an issue with the job spec or the Data Provider may have delisted the asset. Reach out to Chainlink Labs.`)
        }
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
            result: message.mid || 0, // Already validated in the filter above
            data: {
              result: message.mid || 0, // Already validated in the filter above
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
