import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('Polygon Conversion Logger')

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
  Settings: typeof config.settings
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

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const from = param.base.toUpperCase()
      const to = param.quote.toUpperCase()
      const amount = param.amount
      const precision = param.precision
      const url = `/v1/conversion/${from}/${to}`
      const requestConfig = {
        baseURL: settings.API_ENDPOINT,
        url,
        method: 'GET',
        params: {
          apikey: settings.API_KEY,
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
    if (!res.data.converted) {
      const errorMessage = `The data provider didn't return any value`
      logger.error(errorMessage)
      return [
        {
          params: { ...params[0] },
          response: {
            statusCode: 502,
            errorMessage,
          },
        },
      ]
    }
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
