import { EndpointTypes } from './router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Alphavantage HttpEndpoint')

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const from = param.base
      const to = param.quote

      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        method: 'GET',
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          from_symbol: from,
          to_symbol: to,
          symbol: from,
          market: to,
          apikey: config.API_KEY,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    if (!res.data) {
      logger.error(`There was a problem getting the data from the source`)
      return []
    }
    return params.map((param) => {
      const result = Number(res.data['Realtime Currency Exchange Rate']['5. Exchange Rate'])
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
