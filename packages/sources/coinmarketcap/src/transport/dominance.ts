import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalHttpTransportTypes, ResultPath } from './utils'
export const httpTransport = new HttpTransport<GlobalHttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/global-metrics/quotes/latest',
        headers: {
          'X-CMC_PRO_API_KEY': config.API_KEY,
        },
      },
    }
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const dataKey = `${param.market.toLowerCase()}_dominance`
      const result = res.data.data[dataKey as ResultPath]
      return {
        params: param,
        response: {
          data: {
            result,
          },
          result: result,
        },
      }
    })
  },
})
