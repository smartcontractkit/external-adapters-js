import {
  WebsocketReverseMappingTransport,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('TradingEconomics WS Price')

export interface Message {
  s: string
  i: string
  pch: number
  nch: number
  bid: number
  ask: number
  price: number
  dt: number
  state: string
  type: string
  dhigh: number
  dlow: number
  o: number
  prev: number
  topic: string
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Message
  }
}
/*
Tradingeconomics EA currently does not receive asset prices during off-market hours. When a heartbeat message is received during these hours,
we update the TTL of cache entries that EA is requested to provide a price during off-market hours.
 */
const updateTTL = async (transport: WebSocketTransport<WsTransportTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => {
      const { API_CLIENT_KEY, API_CLIENT_SECRET, WS_API_ENDPOINT } = context.adapterSettings
      return `${WS_API_ENDPOINT}?client=${API_CLIENT_KEY}:${API_CLIENT_SECRET}`
    },
    handlers: {
      message: (message, context) => {
        if (!message.topic) {
          return []
        }
        // Check for a heartbeat message, refresh the TTLs of all requested entries in the cache
        if (message.topic === 'keepalive') {
          wsTransport.lastMessageReceivedAt = Date.now()
          updateTTL(wsTransport, context.adapterSettings.CACHE_MAX_AGE)
          return []
        }

        const pair = wsTransport.getReverseMapping(message.s)
        if (!pair) {
          logger.error(`Pair not found in websocket reverse map for message symbol - ${message.s}`)
          return []
        }
        if (message.price === undefined) {
          const message = `Tradingeconomics provided no data for ${JSON.stringify(pair)}`
          logger.info(message)
          return [
            {
              params: pair,
              response: {
                errorMessage: message,
                statusCode: 502,
              },
            },
          ]
        }

        return [
          {
            params: pair,
            response: {
              result: message.price,
              data: {
                result: message.price,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: new Date(message.dt).getTime(),
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (param) => {
        const symbol = `${param.base}${param.quote}:CUR`
        wsTransport.setReverseMapping(symbol, param)
        return { topic: 'subscribe', to: symbol }
      },
    },
  })
