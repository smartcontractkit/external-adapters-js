import ReconnectingWebSocket, { Options } from 'reconnecting-websocket'
import WebSocket from 'ws'

import {
  EndpointContext,
  PriceEndpoint,
  PriceEndpointParams,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketClassProvider,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'

import { customSettings } from '../config'

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

type EndpointTypes = {
  Request: {
    // i.e. { base, quote }
    // base is the symbol to query, e.g. AAPL
    // quote is the currency to convert to, e.g. USD
    Params: PriceEndpointParams
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: typeof customSettings
}

export type WebSocketEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: WebSocketMessage
  }
}

const logger = makeLogger('TwoSigmaPriceWebsocketEndpoint')

let underlyingWebSocket = WebSocket

export const setWebSocket = (ws: typeof WebSocket): void => {
  // Useful for mocking.
  underlyingWebSocket = ws
}

export class WebSocketHandler {
  // The Two Sigma API websocket handler
  //
  // The API works by first sending a message to the server containing the API key
  // and a list of ticker symbols to subscribe to, after which the server begins
  // streaming price updates. However, in order to subscribe to a different set of
  // symbols, the client would need to do so on a new websocket connection as the
  // server seems to ignore all messages after the first.
  //
  // The EA framework doesn't explicitly support this use case so we must work
  // around it using the ReconnectingWebSocket class. It is a wrapper over the
  // usual WebSocket class and importantly provides the ability to force the
  // underlying WS conn to reconnect, thus allowing us to subscribe to a different
  // set of symbols.

  apiKey: string
  subscribedSymbols: Set<string>
  conn?: ReconnectingWebSocket

  constructor() {
    this.apiKey = process.env.WS_API_KEY || 'twosigma api key not set'
    this.subscribedSymbols = new Set()
  }

  url({ adapterConfig: { WS_API_ENDPOINT } }: EndpointContext<WebSocketEndpointTypes>): string {
    return WS_API_ENDPOINT
  }

  options(): Options {
    // Options to be passed into the ReconnectingWebSocket constructor.
    return {
      WebSocket: underlyingWebSocket,
      minReconnectionDelay: 0,
      maxReconnectionDelay: 50, // ms
      debug: true,
    }
  }

  open(conn: ReconnectingWebSocket): void {
    this.conn = conn
  }

  message(message: WebSocketMessage): ProviderResult<WebSocketEndpointTypes>[] | undefined {
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
            providerIndicatedTime: message.timestamp * 1000, // UTC in millis
          },
        },
      })
    }

    return results
  }

  subscribeMessage(params: PriceEndpointParams): WebSocketRequest {
    const symbol = buildSymbol(params)
    this.subscribedSymbols.add(symbol)
    logger.trace(
      `Subscribing to ${symbol}, subscribed set is ${Array.from(this.subscribedSymbols)}`,
    )
    return this.handleSubscriptionUpdate()
  }

  unsubscribeMessage(params: PriceEndpointParams): WebSocketRequest {
    const symbol = buildSymbol(params)
    this.subscribedSymbols.delete(symbol)
    logger.trace(
      `Unsubscribing from ${symbol}, subscribed set is ${Array.from(this.subscribedSymbols)}`,
    )
    return this.handleSubscriptionUpdate()
  }

  handleSubscriptionUpdate(): WebSocketRequest {
    logger.debug('Subscription updated, reconnecting')
    this.conn?.reconnect(1001, 'reconnecting')

    return {
      api_key: this.apiKey,
      symbols: Array.from(this.subscribedSymbols).sort(),
    }
  }
}

export const parseBaseQuote = (symbol: string): PriceEndpointParams | undefined => {
  // "AAPL/USD" -> { base: AAPL, quote: USD }
  const splits = symbol.split('/')
  if (splits.length !== 2) {
    return
  }
  const [base, quote] = splits
  return { base, quote }
}

export const buildSymbol = ({ base, quote }: PriceEndpointParams): string => {
  return `${base}/${quote}`
}

export const makeEndpoint = (): PriceEndpoint<WebSocketEndpointTypes> => {
  // Make sure that the EA framework uses ReconnectingWebSocket instead of the
  // usual WebSocket class.
  WebSocketClassProvider.set(ReconnectingWebSocket)

  const handler = new WebSocketHandler()
  const transport = new WebSocketTransport({
    url: handler.url.bind(handler),
    options: handler.options.bind(handler),
    handlers: {
      open: handler.open.bind(handler),
      message: handler.message.bind(handler),
    },
    builders: {
      subscribeMessage: handler.subscribeMessage.bind(handler),
      unsubscribeMessage: handler.unsubscribeMessage.bind(handler),
    },
  })

  return new PriceEndpoint({
    name: 'price',
    inputParameters: priceEndpointInputParameters,
    transport,
  })
}
