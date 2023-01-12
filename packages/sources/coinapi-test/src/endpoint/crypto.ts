import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, EndpointTypes } from '../crypto-utils'

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),

  parseResponse: (_, res) => {
    return res.data.rates.map((rate) => {
      return {
        params: { base: res.data.asset_id_base, quote: rate.asset_id_quote },
        response: {
          data: {
            result: rate.rate,
          },
          result: rate.rate,
        },
      }
    })
  },
})
