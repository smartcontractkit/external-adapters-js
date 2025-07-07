import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { HttpTransportTypes, prepareRequests } from './common'

const logger = makeLogger('UraniumHTTPTransport')

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) =>
    prepareRequests(
      params,
      config.ALT_API_ENDPOINT,
      '/uranium-digital-qohmmjqaf4jk',
      config.URANIUM_API_KEY,
    ),
  parseResponse: (params, response) => {
    return params.map((param) => {
      const timestamps = {
        providerIndicatedTimeUnixMs: new Date(response.data.timestamp).getTime(),
      }

      const reserve = response.data.totalReserve
      const supply = response.data.totalToken

      if (!response.data || isNaN(Number(reserve)) || isNaN(Number(supply))) {
        return {
          params: param,
          response: {
            errorMessage:
              'Response is missing response fields (expected: totalReserve & totalToken)',
            ripcord: response.data.ripcord ?? undefined,
            statusCode: 502,
            timestamps,
          },
        }
      }

      if (response.data.ripcord) {
        logger.debug(`Ripcord indicator true. Details: ${response.data.ripcordDetails.join(', ')}`)
      }

      const result = Number(reserve)
      return {
        params: param,
        response: {
          result,
          data: {
            result,
            ripcord: response.data.ripcord,
            ripcordAsInt: Number(response.data.ripcord),
          },
          timestamps,
        },
      }
    })
  },
})
