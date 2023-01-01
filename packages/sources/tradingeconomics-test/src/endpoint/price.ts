import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EndpointTypes } from './price-router'

const logger = makeLogger('TradinEconomics HTTP')

export const batchTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((symbol) => {
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: `symbol/${symbol.base}`,
        params: {
          c: `${config.API_CLIENT_KEY}:${config.API_CLIENT_SECRET}`,
        },
      }
      return {
        params: [symbol],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((requestPayload) => {
      const entry = {
        params: requestPayload,
      }

      if (!res.data) {
        const errorMessage = `Tradingeconomics provided no data for token "${requestPayload.base}"`
        logger.warn(errorMessage)
        return {
          ...entry,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }
      const result = res.data[0].Last
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
