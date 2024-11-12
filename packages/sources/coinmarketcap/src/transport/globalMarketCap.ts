import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalHttpTransportTypes } from './utils'

export const httpTransport = new HttpTransport<GlobalHttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/global-metrics/quotes/latest',
          headers: {
            'X-CMC_PRO_API_KEY': config.API_KEY,
          },
          params: {
            convert: param.market.toUpperCase(),
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data.data.quote[param.market].total_market_cap
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
