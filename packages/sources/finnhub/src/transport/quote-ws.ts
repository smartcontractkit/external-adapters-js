import { BaseEndpointTypes } from '../endpoint/quote'
import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'

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
        const trades = message.data
        const results: ProviderResult<WsEndpointTypes>[] = []

        trades.forEach(({ s, p, t }) => {
          const params = wsTransport.getReverseMapping(s)

          if (!params) {
            return
          }

          results.push({
            params,
            response: {
              result: p,
              data: {
                result: p,
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
      const symbol = params.base.toUpperCase()
      wsTransport.setReverseMapping(symbol, params)

      return { type: 'subscribe', symbol }
    },
    unsubscribeMessage: (params) => {
      return { type: 'unsubscribe', symbol: params.base.toUpperCase() }
    },
  },
})
