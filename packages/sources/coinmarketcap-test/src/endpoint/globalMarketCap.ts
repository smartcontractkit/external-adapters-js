import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { GlobalEndpointTypes, inputParameters } from '../global-utils'

const restTransport = new RestTransport<GlobalEndpointTypes>({
  prepareRequest: (req, config) => {
    const market = req.requestContext.data.market
    return {
      baseURL: 'https://pro-api.coinmarketcap.com/v1/',
      url: '/global-metrics/quotes/latest',
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': config.API_KEY || '',
      },
      params: {
        convert: market.toUpperCase(),
      },
    }
  },
  parseResponse: (req, res) => {
    const result = res.data.data.quote[req.requestContext.data.market].total_market_cap
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
  name: 'globalmarketcap',
  transport: restTransport,
  inputParameters,
})
