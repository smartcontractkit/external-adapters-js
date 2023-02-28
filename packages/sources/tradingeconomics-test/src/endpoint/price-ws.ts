import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import includes from '../config/includes.json'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../config'

const logger = makeLogger('TradingEconomics WS Transport')

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message
  }
}

type Includes = {
  from: string
  to: string
  includes: IncludePair[]
}

export type IncludePair = {
  from: string // From symbol
  to: string // To symbol
  adapters?: string[] // Array of adapters this applies to
  inverse?: boolean // If the inverse should be calculated instead
  tokens?: boolean // If the token addresses should be used instead
}

interface Message {
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

const withApiKey = (url: string, key: string, secret: string) => `${url}?client=${key}:${secret}`
const getSubscription = (to: string) => ({ topic: 'subscribe', to })

const baseFromIncludes = includes.reduce(
  (basesMap: { [from: string]: string }, includesSet: Includes) => {
    const { includes } = includesSet
    for (const includePair of includes) {
      basesMap[includesSet.from] = includePair.from
    }
    return basesMap
  },
  {},
)

export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    const { API_CLIENT_KEY, API_CLIENT_SECRET, WS_API_ENDPOINT } = context.adapterConfig
    return withApiKey(WS_API_ENDPOINT, API_CLIENT_KEY, API_CLIENT_SECRET)
  },
  handlers: {
    message: (message) => {
      if (!message.s) {
        logger.error('No subscription message found')
      }
      const base = baseFromIncludes[message?.s] ?? message?.s
      return [
        {
          params: { base, quote: '' },
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
    subscribeMessage: (params) => {
      return getSubscription(params.base)
    },
  },
})
