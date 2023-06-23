import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, constructEntry, CryptoHttpTransportTypes } from './utils'

export const httpTransport = new HttpTransport<CryptoHttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/prices')
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'close')
  },
})
