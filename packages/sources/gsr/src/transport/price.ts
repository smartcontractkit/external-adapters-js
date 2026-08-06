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

// setTimeout coerces any delay above this to 1ms, which would turn an
// implausibly distant expiry into a teardown on every open, i.e. a reconnect
// loop. Clamp instead so we simply re-evaluate at the ceiling.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

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

// Timer that tears down the connection before the token expires. Cleared and
// rescheduled on every open, otherwise timers from previous connections would
// accumulate and close a healthy connection at an arbitrary later point.
let refreshTimer: NodeJS.Timeout | undefined

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
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = undefined
      }

      // GSR stops sending messages once the token expires but leaves the socket
      // open, so the framework only notices after WS_SUBSCRIPTION_UNRESPONSIVE_TTL
      // (120s) of silence — by which point the cache has already gone stale at
      // CACHE_MAX_AGE (90s) and requests are failing. Tear the connection down
      // ahead of expiry so the reconnect happens while data is still flowing.
      if (cachedToken) {
        const reconnectInMs = cachedToken.expiresAtMs - Date.now() - TOKEN_REFRESH_MARGIN_MS

        if (reconnectInMs > 0) {
          const delayMs = Math.min(reconnectInMs, MAX_TIMEOUT_MS)
          logger.info(
            `Scheduled token refresh/reconnect in ${Math.round(
              delayMs / 1000,
            )}s to prevent ungraceful disconnection`,
          )
          refreshTimer = setTimeout(() => {
            refreshTimer = undefined
            cachedToken = null
            logger.info('Token expiry threshold reached, closing connection to reconnect')

            // Close only — deliberately leaving wsConnection set. streamHandler
            // bails out early when there is no connection *and* no new
            // subscription, so clearing the field from outside its loop would
            // strand the transport with nothing to reconnect. Leaving the closed
            // socket in place lets connectionClosed() report true off readyState
            // and the loop reopens on its next pass.
            transport.wsConnection?.close(1000)
          }, delayMs)
        }
      }
      return
    },
    close: (closeEvent) => {
      // Distinguishes a close initiated by GSR from one the framework's
      // unresponsiveness watchdog performed after the provider went silent.
      logger.info(
        `Connection closed (code=${closeEvent.code}, reason=${closeEvent.reason || 'none'})`,
      )
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
