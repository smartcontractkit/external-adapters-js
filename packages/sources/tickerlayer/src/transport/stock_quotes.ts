import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { toNumber } from './util'

export interface WSResponse {
  type: string
  channel: string
  asset: string
  symbol: string
  bid: number | string
  ask: number | string
  mid: number | string
  session: string
  bid_size: number | string
  ask_size: number | string
  ts: number
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const logger = makeLogger('StockQuotesTransport')

export const quotesMessageType = 'quote'

export class StockQuotesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context) =>
        `${context.adapterSettings.WS_API_ENDPOINT}?apiKey=${context.adapterSettings.API_KEY}`,
      handlers: {
        message(message) {
          if (message.type === 'system') {
            logger.debug({ msg: 'Ignoring system message', ignoredMessage: message })
            return
          }
          const isOvernight = message.session == 'overnight'
          const bid_price = toNumber(message.bid)
          const ask_price = toNumber(message.ask)
          const bid_volume = isOvernight ? 0 : toNumber(message.bid_size) || undefined
          const ask_volume = isOvernight ? 0 : toNumber(message.ask_size) || undefined
          const providerIndicatedTimeUnixMs = toNumber(message.ts)
          if (
            message.type !== quotesMessageType ||
            !message.symbol ||
            !bid_price ||
            !ask_price ||
            bid_volume === undefined ||
            ask_volume === undefined ||
            !providerIndicatedTimeUnixMs
          ) {
            logger.warn({ msg: 'Ignoring unexpected message', ignoredMessage: message })
            return
          }

          const mid_price = toNumber(message.mid) || (bid_price + ask_price) / 2

          return [
            {
              params: {
                base: message.symbol,
                assetType: message.asset,
                isOvernight,
              },
              response: {
                result: null,
                data: {
                  mid_price,
                  bid_price,
                  ask_price,
                  bid_volume,
                  ask_volume,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs,
                },
              },
            },
          ]
        },
      },
      builders: {
        // De-dupe subscriptions by channel & symbol so that two requests for the same symbol
        // but different isOvernight values don't interfere with each other.
        customSubscriptionMessages: (_context, subscriptions) => {
          const desiredKeys = new Set(subscriptions.desired.map(subscriptionKey))
          const unsubscribes = [
            ...new Map(subscriptions.stale.map((params) => [subscriptionKey(params), params])),
          ]
            .filter(([key]) => !desiredKeys.has(key))
            .map(([, params]) => ({
              action: 'unsubscribe',
              channels: [channel(params)],
              symbols: [params.base],
            }))

          const newParams = new Set(subscriptions.new.map((params) => JSON.stringify(params)))
          const alreadySubscribedKeys = new Set(
            subscriptions.desired
              .filter((params) => !newParams.has(JSON.stringify(params)))
              .map(subscriptionKey),
          )

          const subscribes = [
            ...new Map(subscriptions.new.map((params) => [subscriptionKey(params), params])),
          ]
            .filter(([key]) => !alreadySubscribedKeys.has(key))
            .map(([, params]) => ({
              action: 'subscribe',
              channels: [channel(params)],
              symbols: [params.base],
              ...(params.isOvernight && { spread: 'full' }),
            }))

          return [...unsubscribes, ...subscribes]
        },
      },
    })
  }
}

const channel = (params: TypeFromDefinition<BaseEndpointTypes['Parameters']>) =>
  params.isOvernight ? 'overnight.quotes' : `${params.assetType}.quotes`

const subscriptionKey = (params: TypeFromDefinition<BaseEndpointTypes['Parameters']>) =>
  `${channel(params)}:${params.base}`

export const wsTransport = new StockQuotesWebSocketTransport()
