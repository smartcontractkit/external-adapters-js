import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalEndpointTypes, inputParameters } from '../global-utils'

const httpTransport = new HttpTransport<GlobalEndpointTypes>({
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

export const endpoint = new AdapterEndpoint<GlobalEndpointTypes>({
  name: 'globalmarketcap',
  transport: httpTransport,
  inputParameters,
})
