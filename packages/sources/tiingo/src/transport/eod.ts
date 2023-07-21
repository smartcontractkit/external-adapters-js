import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/eod'
interface ProviderResponseBody {
  adjClose: number
  adjHigh: number
  adjLow: number
  adjOpen: number
  adjVolume: number
  close: number
  date: string
  divCash: number
  high: number
  low: number
  open: number
  splitFactor: number
  volume: number
}
interface ErrorResponse {
  detail: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[] | ErrorResponse
  }
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `tiingo/daily/${param.base.toLowerCase()}/prices`,
          params: { token: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if ((res.data as ErrorResponse).detail) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: (res.data as ErrorResponse).detail,
            statusCode: 502,
          },
        },
      ]
    }

    return params.map((entry) => {
      const result = (res.data as ProviderResponseBody[])[0]?.close
      if (!result) {
        return {
          params: { base: entry.base },
          response: {
            errorMessage: `Could not retrieve valid data from Data Provider for ticket ${entry.base}. This is likely an issue with the Data Provider or the input params/overrides`,
            statusCode: 502,
          },
        }
      }

      return {
        params: { base: entry.base },
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
