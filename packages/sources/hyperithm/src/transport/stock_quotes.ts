import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'

interface WsEquityResponse {
  type: 'equity'
  ask: string
  askVolume: string
  bid: string
  bidVolume: string
  lastTradedPrice: string
  mid: string
  symbol: string
  timestamp: number
}

interface WsIndexResponse {
  type: 'index'
  value: string
  symbol: string
  timestamp: number
}

interface WsErrorResponse {
  error: string
}

export type WSResponse = WsEquityResponse | WsIndexResponse | WsErrorResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const getDataForEquity = (message: WsEquityResponse): WsTransportTypes['Response']['Data'] => {
  return {
    last_price: Number(message.lastTradedPrice),
    mid_price: Number(message.mid),
    bid_price: Number(message.bid),
    bid_volume: Number(message.bidVolume),
    ask_price: Number(message.ask),
    ask_volume: Number(message.askVolume),
    timestamp_iso: new Date(message.timestamp / 1000).toISOString(),
  }
}

const getDataForIndex = (message: WsIndexResponse): WsTransportTypes['Response']['Data'] => {
  const value = Number(message.value)
  return {
    last_price: value,
    mid_price: value,
    bid_price: value,
    bid_volume: 0,
    ask_price: value,
    ask_volume: 0,
    timestamp_iso: new Date(message.timestamp / 1000).toISOString(),
  }
}

const logger = makeLogger('StockQuotesTransport')

let wsConnection: WebSocket | undefined = undefined
export const invalidSymbols = new Set<string>()
const INVALID_SYMBOLS_PREFIX = 'invalid symbols: '
// We pass this code to indicate a websocket connection closure is not
// unexpected.
const NORMAL_WS_CLOSURE_CODE = 1000

export class StockQuotesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context, _desiredSubs, urlConfigFunctionParameters) => {
        // We rotate between 2 endpoints so in case one has problems we'll end
        // up on the other.
        const index = urlConfigFunctionParameters.streamHandlerInvocationsWithNoConnection % 2
        return `${context.adapterSettings.WS_API_ENDPOINT}/${index}?token=${context.adapterSettings.API_KEY}`
      },
      handlers: {
        open: (connection) => {
          wsConnection = connection
        },
        message(message) {
          if ('error' in message) {
            logger.error(`Received error message from provider: ${message.error}`)
            if (message.error.startsWith(INVALID_SYMBOLS_PREFIX)) {
              // We know the individual symbols don't contain a comma because
              // of custom input validation so this splitting should be safe.
              const symbols = message.error.slice(INVALID_SYMBOLS_PREFIX.length).split(', ')
              symbols.forEach((symbol) => invalidSymbols.add(symbol))
              logger.error(
                `Invalid symbols: ${symbols.join(
                  ', ',
                )}. They will be ignored in future requests. Reconnecting.`,
              )
            }
            // Disconnect to re-establish the connection with the correct set
            // of symbols.
            wsConnection?.close(NORMAL_WS_CLOSURE_CODE)
            return
          }

          let data: WsTransportTypes['Response']['Data']
          if (message.type === 'equity') {
            data = getDataForEquity(message)
          } else if (message.type === 'index') {
            data = getDataForIndex(message)
          } else {
            logger.warn(`Ignoring unknown message type: ${JSON.stringify(message)}`)
            return
          }

          return [
            {
              params: { base: message.symbol },
              response: {
                result: data.last_price,
                data,
                timestamps: {
                  providerIndicatedTimeUnixMs: Math.floor(message.timestamp / 1000),
                },
              },
            },
          ]
        },
      },
      builders: {
        customSubscriptionMessages: (_context, subscriptions) => {
          if (subscriptions.new.length === 0 && subscriptions.stale.length === 0) {
            // Nothing changed so nothing to do.
            return []
          }
          // All subscribe messages after the first one are ignored by
          // Hyperithm, so to change the subscription set, we always have to
          // first disconnect.
          // Then we recognize the first round after reconnecting because all
          // desired subscriptions are also new.
          if (
            subscriptions.new.length !== subscriptions.desired.length ||
            subscriptions.stale.length > 0
          ) {
            wsConnection?.close(NORMAL_WS_CLOSURE_CODE)
            return []
          }
          const symbols = subscriptions.desired
            .map(({ base }) => base)
            .filter((symbol) => !invalidSymbols.has(symbol))
          return [{ subscribe: symbols }]
        },
      },
    })
  }
}

export const wsTransport = new StockQuotesWebSocketTransport()
