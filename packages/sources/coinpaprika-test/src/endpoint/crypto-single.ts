import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from '../config'
import { buildUrlPath, EndpointTypesSingle, inputParameters } from '../crypto-utils'

const restEndpointTransport = new RestTransport<EndpointTypesSingle>({
  prepareRequest: (req, config) => {
    const baseURL = config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
    const coin = req.requestContext.data.coinid ?? req.requestContext.data.base
    const params = {
      quotes: req.requestContext.data.quote.toUpperCase(),
    }
    const headers: { Authorization?: string } = {}
    if (config.API_KEY) {
      headers['Authorization'] = config.API_KEY
    }
    const url = buildUrlPath('v1/tickers/:coin', { coin: coin?.toLowerCase() })

    return {
      baseURL,
      url,
      method: 'GET',
      params,
      headers,
    }
  },
  parseResponse: (req, res) => {
    const quote = `${req.requestContext.data.quote?.toString().toUpperCase()}`
    return {
      data: {
        result: res.data.quotes[quote].price,
      },
      statusCode: 200,
      result: res.data.quotes[quote].price,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypesSingle>({
  name: 'crypto-single',
  transport: restEndpointTransport,
  inputParameters,
})
