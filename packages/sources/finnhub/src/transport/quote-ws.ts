import { BaseEndpointTypes, buildSymbol } from '../endpoint/quote'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { parseResult } from './quote-http'

const logger = makeLogger('Finnhub quote endpoint WS')

type WsMessageError = {
  type: 'error'
  msg: string
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

type WsMessage = WsMessageError | WsMessageTrade

type WsEndpointTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const wsTransport = new WebsocketReverseMappingTransport<WsEndpointTypes, string>({
  url: ({ adapterSettings }) =>
    `${adapterSettings.WS_API_ENDPOINT}?token=${adapterSettings.API_KEY}`,
  handlers: {
    message: (message) => {
      if (message.type === 'error') {
        logger.error(message.msg)
        return
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
