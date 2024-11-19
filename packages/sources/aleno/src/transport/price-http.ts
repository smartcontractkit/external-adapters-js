import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'

export interface ResponseSchema {
  [index: number]: {
    id: string
    baseSymbol: string
    quoteSymbol: string
    processTimestamp: number
    processBlockChainId: string
    processBlockNumber: number
    processBlockTimestamp: number
    aggregatedLast7DaysBaseVolume: number
    price: number
    aggregatedMarketDepthMinusOnePercentUsdAmount: number
    aggregatedMarketDepthPlusOnePercentUsdAmount: number
    aggregatedMarketDepthUsdAmount: number
    aggregatedLast7DaysUsdVolume: number
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'baseTokenStates/latest',
          headers: {
            'x-api-key': config.API_KEY,
          },
        },
      }
    })
  },

  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.base}/${param.quote}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      let result = undefined

      Object.values(response.data).forEach((row) => {
        if (row.baseSymbol === param.base && row.quoteSymbol === param.quote) {
          result = Number(row.price)
        }
      })

      if (result === undefined) {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.base}/${param.quote}`,
            statusCode: 502,
          },
        }
      }

      return {
        params: param,
        response: {
          result,
          data: {
            result,
          },
        },
      }
    })
  },
})
