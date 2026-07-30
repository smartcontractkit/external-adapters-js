import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { getToken, TokenWithExpiry } from './authutils'

const logger = makeLogger('GSR WS price')

type WsMessage = {
  type: string
  data: {
    symbol: string
    price: number
    bidPrice: number
    askPrice: number
    ts: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

let cachedToken: TokenWithExpiry | null = null
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000 // Refresh 5 minutes before expiry

const getTokenForConnection = async (
  apiEndpoint: string,
  userId: string,
  publicKey: string,
  privateKey: string,
): Promise<string> => {
  const now = Date.now()

  // If we have a cached token and it won't expire soon, reuse it
  if (cachedToken && cachedToken.expiresAtMs - now > TOKEN_REFRESH_MARGIN_MS) {
    return cachedToken.token
  }

  // Fetch a fresh token
  cachedToken = await getToken(apiEndpoint, userId, publicKey, privateKey)
  const timeUntilExpiry = cachedToken.expiresAtMs - Date.now()
  logger.info(`Token refresh triggered, expires in ${Math.round(timeUntilExpiry / 1000)}s`)

  return cachedToken.token
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => ({
    headers: {
      'x-auth-token': await getTokenForConnection(
        context.adapterSettings.API_ENDPOINT,
        context.adapterSettings.WS_USER_ID,
        context.adapterSettings.WS_PUBLIC_KEY,
        context.adapterSettings.WS_PRIVATE_KEY,
      ),
      'x-auth-userid': context.adapterSettings.WS_USER_ID,
    },
  }),
  handlers: {
    open: () => {
      // Set up a timer to proactively reconnect before the token expires
      // This prevents the ungraceful connection closure when GSR closes connections after token expiry
      if (cachedToken) {
        const now = Date.now()
        const timeUntilExpiry = cachedToken.expiresAtMs - now
        const reconnectInMs = timeUntilExpiry - TOKEN_REFRESH_MARGIN_MS

        if (reconnectInMs > 0) {
          logger.info(
            `Scheduled token refresh/reconnect in ${Math.round(
              reconnectInMs / 1000,
            )}s to prevent ungraceful disconnection`,
          )
          setTimeout(() => {
            // Trigger a reconnection by invalidating the cached token
            // The next message/request will cause a reconnect with a fresh token
            cachedToken = null
            logger.info('Token expiry threshold reached, invalidating token for reconnection')
          }, reconnectInMs)
        }
      }
      return
    },
    message(message): ProviderResult<WsTransportTypes>[] | undefined {
      if (message.type == 'error') {
        logger.error(`Got error from DP: ${JSON.stringify(message)}`)
        return
      } else if (message.type != 'ticker') {
        return
      }

      const pair = message.data.symbol.split('.')
      if (pair.length != 2) {
        logger.warn(`Got a price update with an unknown pair: ${message.data.symbol}`)
        return
      }

      return [
        {
          params: {
            base: pair[0].toString(),
            quote: pair[1].toString(),
          },
          response: {
            result: message.data.price,
            data: {
              result: message.data.price,
              mid: message.data.price,
              bid: message.data.bidPrice,
              ask: message.data.askPrice,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Math.round(message.data.ts / 1e6), // Value from provider is in nanoseconds
            },
          },
        },
      ]
    },
  },
  builders: {
    // Note: As of writing this (2022-11-07), GSR has a bug where you cannot subscribe to a pair
    // after you've already subscribed & unsubscribed to that pair on the same WS connection.
    subscribeMessage: (params) => ({
      action: 'subscribe',
      symbols: [`${params.base}.${params.quote}`.toUpperCase()],
    }),
    unsubscribeMessage: (params) => ({
      action: 'unsubscribe',
      symbols: [`${params.base}.${params.quote}`.toUpperCase()],
    }),
  },
})
