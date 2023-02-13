import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { buildUrlPath } from './utils'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'

export const inputParameters = {
  base: {
    aliases: ['from'],
    required: false,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    required: false,
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
  amount: {
    required: false,
    description: 'The amount of the `base` to convert ',
    default: 1,
    type: 'number',
  },
  precision: {
    required: false,
    description: 'The number of significant figures to include',
    default: 6,
    type: 'number',
  },
} as const

interface RequestParams {
  base: string
  quote: string
  amount?: number
  precision?: number
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export interface ProviderResponseBody {
  converted: number
  from: string
  initialAmount: number
  last: { ask: number; bid: number; exchange: number; timestamp: number }
  request_id: string
  status: string
  symbol: string
  to: string
}

const DEFAULT_AMOUNT = 1
const DEFAULT_PRECISION = 6

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const from = param.base.toUpperCase()
      const to = param.quote.toUpperCase()
      const amount = param.amount || DEFAULT_AMOUNT
      const precision = param.precision || DEFAULT_PRECISION
      const url = buildUrlPath('/v1/conversion/:from/:to', { from, to })
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url,
        method: 'GET',
        params: {
          apikey: config.API_KEY,
          amount,
          precision,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data.converted
      return {
        params: { ...param },
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'conversion',
  transport: httpTransport,
  inputParameters: inputParameters,
})
