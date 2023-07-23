import { BaseEndpointTypes, buildSymbol, splitSymbol } from '../endpoint/quote'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

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

export const wsTransport = new WebSocketTransport<WsEndpointTypes>({
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
        return trades.map(({ s, p, t }) => ({
          params: splitSymbol(s),
          response: {
            result: p,
            data: {
              result: p,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: t,
            },
          },
        }))
      }

      return
    },
  },
  builders: {
    subscribeMessage: (params) => {
      return { type: 'subscribe', symbol: buildSymbol(params) }
    },
    unsubscribeMessage: (params) => {
      return { type: 'unsubscribe', symbol: buildSymbol(params) }
    },
  },
})
