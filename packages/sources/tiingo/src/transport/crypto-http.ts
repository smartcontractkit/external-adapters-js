import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBodyForPrice, constructEntry, CryptoHttpTransportTypes } from './utils'

export const httpTransport = new HttpTransport<CryptoHttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBodyForPrice(params, config, 'tiingo/crypto/prices')
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'close')
  },
})
