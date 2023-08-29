import { BaseEndpointTypes } from '../endpoint/forex'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { groupArrayByKey } from '@chainlink/external-adapter-framework/util'

interface ResponseSchema {
  disclaimer: string
  license: string
  timestamp: number
  base: string
  rates: {
    [key: string]: number
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    // OpenExchangeRates supports batching only for base params, so we are grouping params by bases meaning we will send N number of requests to DP where the N is number of unique bases
    const groupedSymbols = groupArrayByKey(params, 'base')
    return Object.entries(groupedSymbols).map(([base, inputParams]) => {
      return {
        params: inputParams,
        request: {
          url: 'latest.json',
          baseURL: config.API_ENDPOINT,
          params: {
            app_id: config.API_KEY,
            base: base.toUpperCase(),
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (!res.data.rates) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `OpenExchangeRates provided no data for base "${param.base}" and quote "${param.quote}"`,
          statusCode: 502,
        },
      }))
    }
    return params.map((param) => {
      const result = res.data.rates[param.quote.toUpperCase()]
      if (!result) {
        return {
          params: param,
          response: {
            errorMessage: `OpenExchangeRates provided no data for base "${param.base}" and quote "${param.quote}"`,
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
