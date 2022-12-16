import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from './price-router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import quoteEventSymbols from '../config/quoteSymbols.json'

const logger = makeLogger('DxFeed Price Batched')

export const batchTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
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
      return {
        params,
        request: { ...requestConfig, auth: { username, password } },
      }
    }
    return {
      params,
      request: requestConfig,
    }
  },
  parseResponse: (params, res) => {
    return params.map((requestPayload) => {
      const entry = {
        params: requestPayload,
      }
      let result: number
      const events = quoteEventSymbols[requestPayload.base as keyof typeof quoteEventSymbols]
        ? 'Quote'
        : 'Trade'
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
