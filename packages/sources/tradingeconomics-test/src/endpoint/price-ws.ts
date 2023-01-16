import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import includes from '../config/includes.json'

import { customSettings } from '../config'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'

const logger = makeLogger('Tradingeconomics WS')

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: Message[]
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
      basesMap[includePair.from] = includesSet.from
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
      if (Object.keys(message).length === 0) {
        logger.debug('WS message is empty, skipping')
        return []
      }
      return message.map((msg) => {
        const base = baseFromIncludes[msg?.s] ?? msg?.s
        const result = {
          params: { base, quote: 'USD' },
          response: {
            result: msg.price,
            data: {
              result: msg.price,
            },
            timestamps: {
              providerIndicatedTime: new Date(msg.dt).getTime(),
            },
          },
        }
        return result
      })
    },
  },
  builders: {
    subscribeMessage: (params) => {
      // TODO beware, this assumes there is only one matching result in the limits.json list
      const values = includes.filter((element) => element.from === params.base)
      const from = values[0].includes[0].from
      return getSubscription(from)
    },
  },
})
