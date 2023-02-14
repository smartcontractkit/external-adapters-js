import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalEndpointTypes, inputParameters, ResultPath } from '../global-utils'

const httpTransport = new HttpTransport<GlobalEndpointTypes>({
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

export const endpoint = new AdapterEndpoint<GlobalEndpointTypes>({
  name: 'dominance',
  transport: httpTransport,
  inputParameters,
})
