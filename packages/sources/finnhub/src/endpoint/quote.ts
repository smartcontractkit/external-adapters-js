import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  HttpTransport,
  TransportRoutes,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'

const logger = makeLogger('Finnhub quote endpoint')

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
})

export interface ProviderResponseBody {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

type RestEndpointTypes = EndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const httpTransport = new HttpTransport<RestEndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const symbol = param.base.toUpperCase()
      const requestConfig = {
        baseURL: `${settings.API_ENDPOINT}/quote`,
        method: 'GET',
        params: {
          symbol,
          token: settings.API_KEY,
        },
      }
      return {
        params: [param],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    const data = res.data
    if (!data.c) {
      return params.map((param) => {
        const errorMessage = `No data found for ${param.base}`
        logger.info(errorMessage)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      })
    }

    return params.map((param) => {
      const result = data.c
      return {
        params: param,
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})

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

type WsEndpointTypes = EndpointTypes & {
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
          params: { base: s },
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
      return { type: 'subscribe', symbol: `${params.base}`.toUpperCase() }
    },
    unsubscribeMessage: (params) => {
      return { type: 'unsubscribe', symbol: `${params.base}`.toUpperCase() }
    },
  },
})

export const buildQuoteEndpoint = (overrides?: Record<string, string>) =>
  new PriceEndpoint<EndpointTypes>({
    name: 'quote',
    aliases: ['common', 'stock', 'forex'],
    transportRoutes: new TransportRoutes<EndpointTypes>()
      .register('ws', wsTransport)
      .register('rest', httpTransport),
    defaultTransport: 'rest',
    customRouter: (_req, adapterConfig) => (adapterConfig.WS_ENABLED ? 'ws' : 'rest'),
    inputParameters: inputParameters,
    overrides,
  })

export const endpoint = buildQuoteEndpoint(overrides.finnhub)
