import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalEndpointTypes, inputParameters } from '../global-utils'

const restTransport = new RestTransport<GlobalEndpointTypes>({
  prepareRequest: (_, config) => {
    return {
      baseURL: 'https://pro-api.coinmarketcap.com/v1/',
      url: '/global-metrics/quotes/latest',
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': config.API_KEY || '',
      },
    }
  },
  parseResponse: (req, res) => {
    const dataKey = `${req.requestContext.data.market.toLowerCase()}_dominance`
    const result = res.data.data[dataKey as 'btc_dominance' | 'eth_dominance']
    return {
      data: {
        result,
      },
      statusCode: 200,
      result: result,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<GlobalEndpointTypes>({
  name: 'dominance',
  transport: restTransport,
  inputParameters,
})
