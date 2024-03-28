import { BaseEndpointTypes, buildSymbol } from '../endpoint/quote'
import {
  WebsocketReverseMappingTransport,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { parseResult } from './utils'

const logger = makeLogger('Finnhub quote endpoint WS')

type WsMessageError = {
  type: 'error'
  msg: string
}

type WsMessageHeartbeat = {
  type: 'ping'
}

type WsMessageTrade = {
  type: 'trade'
  data: {
    s: string // Symbol
    p: number // Last price
    t: number // UNIX ms timestamp
    v: number // Volume
    c: string[] // Trade conditions
  }[]
}

type WsMessage = WsMessageError | WsMessageTrade | WsMessageHeartbeat

type WsEndpointTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}
/*
Finnhub EA currently does not receive asset prices during off-market hours. When a heartbeat message is received during these hours,
we update the TTL of cache entries that EA is requested to provide a price during off-market hours.
 */
const updateTTL = async (transport: WebSocketTransport<WsEndpointTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}

export const wsTransport = new WebsocketReverseMappingTransport<WsEndpointTypes, string>({
  url: ({ adapterSettings }) =>
    `${adapterSettings.WS_API_ENDPOINT}?token=${adapterSettings.API_KEY}`,
  handlers: {
    message: (message, context) => {
      if (message.type === 'error') {
        logger.error(message.msg)
        return
      }

      // Check for a heartbeat message, refresh the TTLs of all requested entries in the cache
      if (message.type === 'ping') {
        wsTransport.lastMessageReceivedAt = Date.now()
        updateTTL(wsTransport, context.adapterSettings.CACHE_MAX_AGE)
        return []
      }

      if (message.type === 'trade') {
        const results: ProviderResult<WsEndpointTypes>[] = []

        const trades = message.data

        trades.forEach(({ s, p, t }) => {
          const params = wsTransport.getReverseMapping(s)

          if (!params) {
            logger.error(`Pair not found in websocket reverse map for message symbol '${s}'`)
            return
          }

          const value = parseResult(s, p)

          results.push({
            params,
            response: {
              result: value,
              data: {
                result: value,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: t,
              },
            },
          })
        })

        return results
      }

      return
    },
  },
  builders: {
    subscribeMessage: (params) => {
      const symbol = buildSymbol(params)
      wsTransport.setReverseMapping(symbol, params)
      return { type: 'subscribe', symbol: buildSymbol(params) }
    },
    unsubscribeMessage: (params) => {
      return { type: 'unsubscribe', symbol: buildSymbol(params) }
    },
  },
})
