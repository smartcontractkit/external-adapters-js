import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { getToken, renewToken, TokenWithExpiry } from './authutils'
import {
  livenessProbeDelayMs,
  refreshDelayMs,
  renewalHeld,
  TOKEN_REFRESH_MARGIN_MS,
} from './tokenRefresh'

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

// Timers driving the refresh cycle. Cleared and rescheduled on every open,
// otherwise timers from previous connections would accumulate and act on a
// healthy connection at an arbitrary later point.
let refreshTimer: NodeJS.Timeout | undefined
let livenessTimer: NodeJS.Timeout | undefined

// Set on every inbound frame, so the liveness probe can tell whether the
// provider is still talking to us after an in-place renewal.
let lastMessageAtMs = 0

const clearTimers = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = undefined
  }
  if (livenessTimer) {
    clearTimeout(livenessTimer)
    livenessTimer = undefined
  }
}

const closeForReconnect = (reason: string) => {
  logger.info(`${reason}; closing connection to reconnect`)
  cachedToken = null
  // Close only — deliberately leaving wsConnection set. streamHandler bails out
  // early when there is no connection *and* no new subscription, so clearing the
  // field from outside its loop would strand the transport with nothing to
  // reconnect. Leaving the closed socket in place lets connectionClosed() report
  // true off readyState and the loop reopens on its next pass.
  transport.wsConnection?.close(1000)
}

/**
 * Renewing the token is an HTTP call; it says nothing about whether GSR extended
 * the session behind the already-open socket, which still carries the old token
 * in its handshake headers. So after a successful renewal we wait until just
 * past the old expiry and check whether frames are still arriving. If they
 * stopped, the renewal did not hold and we fall back to reconnecting — early
 * enough that cached prices have not yet aged out.
 */
const scheduleLivenessProbe = (previousExpiryMs: number) => {
  livenessTimer = setTimeout(() => {
    livenessTimer = undefined
    if (renewalHeld(lastMessageAtMs, Date.now())) {
      logger.info('Still receiving data past the previous token expiry; in-place renewal held')
      return
    }
    closeForReconnect(
      `No provider data for ${Math.round(
        (Date.now() - lastMessageAtMs) / 1000,
      )}s past the previous token expiry, so the in-place renewal did not extend the session`,
    )
  }, livenessProbeDelayMs(previousExpiryMs, Date.now()))
}

const scheduleRefresh = (token: TokenWithExpiry, settings: RefreshSettings) => {
  const delayMs = refreshDelayMs(token, Date.now())
  if (delayMs === null) {
    return
  }
  logger.info(
    `Scheduled token refresh in ${Math.round(delayMs / 1000)}s to prevent ungraceful disconnection`,
  )
  refreshTimer = setTimeout(() => {
    refreshTimer = undefined
    void refreshTokenOrReconnect(settings)
  }, delayMs)
}

/**
 * Preferred path: renew the token in place and leave the connection up. Only
 * tear the socket down if that fails, since a reconnect — while cheap — drops
 * every subscription and re-runs the handshake.
 */
const refreshTokenOrReconnect = async (settings: RefreshSettings) => {
  const previous = cachedToken
  if (!previous) {
    closeForReconnect('No cached token to renew')
    return
  }

  try {
    const renewed = await renewToken(
      settings.apiEndpoint,
      settings.userId,
      settings.privateKey,
      previous.token,
    )
    cachedToken = renewed
    scheduleLivenessProbe(previous.expiresAtMs)
    scheduleRefresh(renewed, settings)
  } catch (e) {
    closeForReconnect(`Token renewal failed (${(e as Error).message})`)
  }
}

type RefreshSettings = {
  apiEndpoint: string
  userId: string
  privateKey: string
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
    open: (_wsConnection, context) => {
      clearTimers()
      lastMessageAtMs = Date.now()

      // GSR stops sending messages once the token expires but leaves the socket
      // open, so the framework only notices after WS_SUBSCRIPTION_UNRESPONSIVE_TTL
      // (120s) of silence — by which point the cache has already gone stale at
      // CACHE_MAX_AGE (90s) and requests are failing. Act ahead of expiry, while
      // data is still flowing.
      if (cachedToken) {
        scheduleRefresh(cachedToken, {
          apiEndpoint: context.adapterSettings.API_ENDPOINT,
          userId: context.adapterSettings.WS_USER_ID,
          privateKey: context.adapterSettings.WS_PRIVATE_KEY,
        })
      }
      return Promise.resolve()
    },
    close: (closeEvent) => {
      // Distinguishes a close initiated by GSR from one the framework's
      // unresponsiveness watchdog performed after the provider went silent.
      logger.info(
        `Connection closed (code=${closeEvent.code}, reason=${closeEvent.reason || 'none'})`,
      )
    },
    message(message): ProviderResult<WsTransportTypes>[] | undefined {
      // Any frame proves the provider is still talking to us, whatever its type.
      lastMessageAtMs = Date.now()

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
