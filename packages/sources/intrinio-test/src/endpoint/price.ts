import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from './price-router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

const logger = makeLogger('Intrinio Price')

export const batchTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    const [symbol] = params
    const requestConfig = {
      baseURL: config.API_ENDPOINT,
      url: `securities/${symbol.base}/prices/realtime`,
      method: 'GET',
      params: {
        api_key: config.API_KEY,
      },
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
      try {
        result = res.data.last_price
      } catch (e) {
        const errorMessage = `Intrinio provided no data for token "${requestPayload.base}"`
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
