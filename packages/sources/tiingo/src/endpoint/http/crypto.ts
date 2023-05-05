import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, constructEntry, HttpTransportTypes } from '../../crypto-utils'

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/prices')
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'close')
  },
})
