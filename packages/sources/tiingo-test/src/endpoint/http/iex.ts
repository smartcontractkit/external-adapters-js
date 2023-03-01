import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { IEXEndpointTypes } from '../common/iex-router'

export const httpTransport = new HttpTransport<IEXEndpointTypes>({
  prepareRequests: (params, config) => {
    return {
      params: params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: 'iex',
        params: {
          token: config.API_KEY,
          tickers: [...new Set(params.map((p) => `${p.ticker.toLowerCase()}`))].join(','),
        },
      },
    }
  },
  parseResponse: (_, res) => {
    return res.data.map((entry) => {
      return {
        params: { ticker: entry.ticker },
        response: {
          data: {
            result: entry.tngoLast,
          },
          result: entry.tngoLast,
        },
      }
    })
  },
})
