import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from './price-router'

const logger = makeLogger('DxFeed Price Batched')

const quoteEventSymbols: { [key: string]: boolean } = {
  'USO/USD:AFX': true,
}

export const batchTransport = new BatchWarmingTransport<EndpointTypes>({
  prepareRequest: (params, config) => {
    const requestConfig = {
      baseURL: config.API_ENDPOINT,
      url: '/events.json',
      method: 'GET',
      params: {
        events: 'Trade,Quote',
        symbols: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
      },
    }
    const username = config.API_USERNAME
    const password = config.API_PASSWORD

    if (username && password) {
      return { ...requestConfig, auth: { username, password } }
    }
    return requestConfig
  },
  parseResponse: (params, res) => {
    return params.map((requestPayload) => {
      const entry = {
        params: requestPayload,
      }
      let result: number
      const events = quoteEventSymbols[requestPayload.base] ? 'Quote' : 'Trade'
      try {
        if (events === 'Quote') {
          result = res.data[events][requestPayload.base].bidPrice
        } else {
          result = res.data[events][requestPayload.base].price
        }
      } catch (e) {
        const errorMessage = `Dxfeed provided no data for token "${requestPayload.base}"`
        logger.warn(errorMessage)
        return {
          ...entry,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }
      return {
        ...entry,
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
