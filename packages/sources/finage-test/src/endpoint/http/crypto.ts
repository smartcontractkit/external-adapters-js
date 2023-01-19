import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EndpointTypes } from '../crypto-router'

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = `${param.base}${param.quote}`.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/last/crypto/${symbol}`,
          params: { apikey: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.error) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage:
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
            statusCode: 400,
          },
        }
      })
    }

    return params.map((param) => {
      return {
        params: param,
        response: {
          data: {
            result: res.data.price,
          },
          result: res.data.price,
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.timestamp,
          },
        },
      }
    })
  },
})
