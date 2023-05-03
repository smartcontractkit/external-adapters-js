import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionDeltas } from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)
export type RequestParams = typeof inputParameters.validated

// Schema of message sent to Two Sigma to start streaming symbols
export type WebSocketRequest = {
  api_key: string
  symbols: string[] // e.g. ["AAPL/USD"]
}

// Schema of message sent from Two Sigma containing symbol prices
export type WebSocketMessage = {
  timestamp: number // The UTC timestamp in seconds. e.g. 1666705053.713266
  symbol_price_dict: Record<
    string, // The ticker symbol. e.g. AAPL/USD
    SymbolPriceData
  >
}

export type SymbolPriceData = {
  quote_currency: string // Quote currency. e.g. USD
  session_status_flag:
    | 'premarket' // Pre-market trading during pre-market hours (before 9.30am)
    | 'open' // Market is open and trading during market hours
    | 'postmarket' // After-hours trading during post-market hours
    | 'closed' // Market is closed
  asset_status_flag:
    | 'active' // TSS is trading this stock actively
    | 'inactive' // TSS has not traded this stock recently
  confidence_interval: number // Confidence interval in quote currency units. e.g. 0.16416514635149188
  price: number // Price in quote currency units. e.g. 379.64
}

export type WebSocketEndpointTypes = {
  // i.e. { base, quote }
  // base is the symbol to query, e.g. AAPL
  // quote is the currency to convert to, e.g. USD
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  Settings: typeof config.settings
  Provider: {
    WsMessage: WebSocketMessage
  }
}

const logger = makeLogger('TwoSigmaPriceWebsocketEndpoint')

export class TwoSigmaWebsocketTransport extends WebSocketTransport<WebSocketEndpointTypes> {
  // The API works by first sending a message to the server containing the API key
  // and a list of ticker symbols to subscribe to, after which the server begins
  // streaming price updates. However, in order to subscribe to a different set of
  // symbols, the client would need to do so on a new websocket connection as the
  // server seems to ignore all messages after the first.

  override async streamHandler(
    context: EndpointContext<WebSocketEndpointTypes>,
    subscriptions: SubscriptionDeltas<RequestParams>,
  ): Promise<void> {
    if (
      this.wsConnection &&
      !this.connectionClosed() &&
      (subscriptions.new.length || subscriptions.stale.length)
    ) {
      logger.debug(
        `closing WS connection for new subscriptions: ${JSON.stringify(subscriptions.desired)}`,
      )

      const closed = new Promise<void>((resolve) => (this.wsConnection.onclose = resolve))
      this.wsConnection.close()
      await closed
    }

    subscriptions.new = subscriptions.desired
    subscriptions.stale = []

    await super.streamHandler(context, subscriptions)
  }

  override async sendMessages(
    _context: EndpointContext<WebSocketEndpointTypes>,
    subscribes: RequestParams[],
    unsubscribes: unknown[],
  ): Promise<void> {
    // Send a single message containing the entire set of subscribed symbols rather than
    // one message per symbol.

    if (unsubscribes.length) {
      // We explicitly set subscriptions.stale to empty.
      logger.warn(`unexpected unsubscribes: ${JSON.stringify(unsubscribes)}`)
    }

    if (!subscribes.length) {
      // No symbols to subscribe to
      logger.debug(`nothing to subscribe to, skipping initial message`)
      return
    }

    const payload: WebSocketRequest = {
      api_key: process.env.WS_API_KEY || 'twosigma api key not set',
      symbols: subscribes.map(buildSymbol).sort(),
    }
    this.wsConnection.send(this.serializeMessage(payload))
  }
}

export const parseBaseQuote = (symbol: string): RequestParams | undefined => {
  // "AAPL/USD" -> { base: AAPL, quote: USD }
  const splits = symbol.split('/')
  if (splits.length !== 2) {
    return
  }
  const [base, quote] = splits
  return { base, quote }
}

export const buildSymbol = ({ base, quote }: RequestParams): string => {
  return `${base}/${quote}`
}

export const options = {
  url: (context: EndpointContext<WebSocketEndpointTypes>): string => {
    return context.adapterSettings.WS_API_ENDPOINT
  },

  handlers: {
    message: (message: WebSocketMessage): ProviderResult<WebSocketEndpointTypes>[] | undefined => {
      if (!message.timestamp || !message.symbol_price_dict) {
        logger.debug(`Received invalid message: ${message}`)
        return undefined
      }

      const results: ProviderResult<WebSocketEndpointTypes>[] = []
      for (const symbol in message.symbol_price_dict) {
        const priceData = message.symbol_price_dict[symbol]
        const params = parseBaseQuote(symbol)
        if (params === undefined) {
          continue
        }

        results.push({
          params,
          response: {
            result: priceData.price,
            data: {
              result: priceData.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Math.floor(message.timestamp * 1000),
            },
          },
        })
      }

      return results
    },
  },

  // We don't want the 'subscribeMessage' and 'unsubscribeMessage' hooks because we override
  // the 'sendMessages' on the transport to send a single message for the entire set of
  // symbols. However, this empty object is necessary for the transport to actually call our
  // overridden 'sendMessages'.
  builders: {},
}

export const endpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['stock'],
  inputParameters,
  transport: new TwoSigmaWebsocketTransport(options),
})
