import { config } from '../config'
import {
  PriceEndpoint,
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import overrides from '../config/overrides.json'

export const inputParams = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of symbols of the currency to query',
    type: 'string',
    required: true,
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
} satisfies InputParameters & PriceEndpointInputParameters

interface ResponseSchema {
  [quoteSymbol: string]: number
}

interface ErrorResponse {
  Message: string
  Response: string
  Type: number
}

type BatchEndpointTypes = {
  Request: {
    Params: PriceEndpointParams & { hours: number }
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema | ErrorResponse
  }
}

const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const subMs = param.hours * 60 * 60 * 1000
      const toDate = new Date(new Date().getTime() - subMs)
      toDate.setUTCHours(0, 0, 0, 0)
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/data/dayAvg',
          params: {
            fsym: param.base.toUpperCase(),
            tsym: param.quote.toUpperCase(),
            toTs: Math.ceil(toDate.getTime() / 1000),
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.Response === 'Error') {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: (res.data as ErrorResponse).Message,
            statusCode: 400,
          },
        }
      })
    }

    return params.map((param) => {
      const result = (res.data as ResponseSchema)[param.quote.toUpperCase()]
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

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport: httpTransport,
  inputParameters: inputParams,
  overrides: overrides.cryptocompare,
})
