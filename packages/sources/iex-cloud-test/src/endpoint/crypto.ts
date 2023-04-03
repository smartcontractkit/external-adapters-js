import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  CryptoPriceEndpoint,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { PriceEndpointInputParameters } from '@chainlink/external-adapter-framework/adapter'

interface ResponseSchema {
  symbol: string
  primaryExchange: string
  sector: string
  calculationPrice: string
  high: string
  low: string
  latestPrice: string
  latestSource: string
  latestUpdate: number
  latestVolume: string
  previousClose: string
}

export type CryptoEndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
} satisfies InputParameters & PriceEndpointInputParameters

export const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          url: `/crypto/${param.base.toUpperCase()}${param.quote.toUpperCase()}/quote`,
          baseURL: config.API_ENDPOINT,
          params: {
            token: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = Number(res.data.latestPrice)

      if (isNaN(result)) {
        return {
          params: param,
          response: {
            errorMessage: `Iex-Cloud provided no data for base "${param.base}" and quote "${param.quote}"`,
            statusCode: 502,
          },
        }
      }
      return {
        params: param,
        response: {
          data: {
            result: result,
          },
          result,
        },
      }
    })
  },
})

export const endpoint = new CryptoPriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  transport: httpTransport,
  inputParameters: inputParameters,
})
