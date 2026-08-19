import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { getToken, renewToken, TokenWithExpiry } from './authutils'
import { refreshDelayMs } from './tokenRefresh'

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

type Settings = WsTransportTypes['Settings']

/**
 * GSR issues access tokens valid for one hour and, when one expires, simply
 * stops sending data without closing the socket. Left alone, the framework only
 * notices after WS_SUBSCRIPTION_UNRESPONSIVE_TTL (120s) of silence, by which
 * point cached prices have already aged out at CACHE_MAX_AGE (90s) and requests
 * are failing.
 *
 * This transport renews the token ahead of expiry, in place, keeping the
 * connection up. The token travels in the handshake headers, so a successful
 * renewal is not proof the session survived; continued data is. Whenever that
 * evidence is missing the transport falls back to reconnecting, early enough
 * that cached prices are still fresh.
 */
export class GsrWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  private cachedToken: TokenWithExpiry | null = null
  private refreshTimer?: NodeJS.Timeout
  private livenessTimer?: NodeJS.Timeout

  private buildTicker(pair: { base: string; quote: string }) {
    return `${pair.base}.${pair.quote}`.toUpperCase()
  }

  constructor() {
    super({
      url: (context) => context.adapterSettings.WS_API_ENDPOINT,
      options: async (context) => ({
        headers: {
          'x-auth-token': await this.tokenForConnection(context.adapterSettings),
          'x-auth-userid': context.adapterSettings.WS_USER_ID,
        },
      }),
      handlers: {
        open: async (_connection, context) => {
          this.scheduleRefresh(context.adapterSettings)
        },
        close: (event) => {
          // Timers only ever live alongside a connection. Without this an idle
          // adapter — one whose subscriptions have lapsed, so the framework has
          // no reason to reconnect — would go on renewing tokens and then report
          // the resulting silence as a failed renewal.
          this.clearTimers()
          logger.info(`Connection closed (code=${event.code}, reason=${event.reason || 'none'})`)
        },
        message: (message) => this.parsePriceUpdate(message),
      },
      builders: {
        // Note: As of writing this (2022-11-07), GSR has a bug where you cannot subscribe to a pair
        // after you've already subscribed & unsubscribed to that pair on the same WS connection.
        customSubscriptionMessages: (
          _context: EndpointContext<WsTransportTypes>,
          subscriptions: SubscriptionDeltas<{ quote: string; base: string }>,
        ) => {
          const messages = []
          if (subscriptions.new.length > 0) {
            messages.push({
              action: 'subscribe',
              symbols: subscriptions.new.map(this.buildTicker),
            })
          }
          if (subscriptions.stale.length > 0) {
            messages.push({
              action: 'unsubscribe',
              symbols: subscriptions.new.map(this.buildTicker),
            })
          }
          return messages
        },
      },
    })
  }

  /** Reuses the cached token while it has comfortably more life than the refresh margin. */
  private async tokenForConnection(settings: Settings): Promise<string> {
    if (this.cachedToken && refreshDelayMs(this.cachedToken, Date.now()) !== null) {
      return this.cachedToken.token
    }

    this.cachedToken = await getToken(
      settings.API_ENDPOINT,
      settings.WS_USER_ID,
      settings.WS_PUBLIC_KEY,
      settings.WS_PRIVATE_KEY,
    )
    return this.cachedToken.token
  }

  private clearTimers() {
    clearTimeout(this.refreshTimer)
    clearTimeout(this.livenessTimer)
    this.refreshTimer = undefined
    this.livenessTimer = undefined
  }

  private closeForReconnect(reason: string) {
    logger.info(`${reason}; closing connection to reconnect`)
    this.cachedToken = null
    // Close only — deliberately leaving wsConnection set. streamHandler bails
    // out early when there is no connection *and* no new subscription, so
    // clearing the field from outside its loop would strand the transport with
    // nothing to reconnect. Leaving the closed socket in place lets
    // connectionClosed() report true off readyState and the loop reopens on its
    // next pass.
    this.wsConnection?.close(1000)
  }

  private scheduleRefresh(settings: Settings) {
    // Only the refresh timer: a liveness probe armed by the renewal that just
    // happened still needs to run.
    clearTimeout(this.refreshTimer)
    this.refreshTimer = undefined

    if (!this.cachedToken) {
      return
    }

    const delayMs = refreshDelayMs(this.cachedToken, Date.now())
    if (delayMs === null) {
      return
    }

    logger.info(`Scheduled token refresh in ${Math.round(delayMs / 1000)}s`)
    this.refreshTimer = setTimeout(() => void this.refreshOrReconnect(settings), delayMs)
  }

  /** Renew in place, and only tear the connection down if that is refused. */
  private async refreshOrReconnect(settings: Settings) {
    const previous = this.cachedToken
    if (!previous) {
      this.closeForReconnect('No cached token to renew')
      return
    }

    try {
      this.cachedToken = await renewToken(
        settings.API_ENDPOINT,
        settings.WS_USER_ID,
        settings.WS_PRIVATE_KEY,
        previous.token,
      )
    } catch (e) {
      this.closeForReconnect(`Token renewal failed (${(e as Error).message})`)
      return
    }

    this.scheduleRefresh(settings)
  }

  private parsePriceUpdate(message: WsMessage): ProviderResult<WsTransportTypes>[] | undefined {
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
  }
}

export const transport = new GsrWebSocketTransport()
