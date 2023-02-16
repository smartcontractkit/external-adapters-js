import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  inputParameters,
} from '../../crypto-utils'

export const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/prices')
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'volumeNotional')
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'volume',
  transport: httpTransport,
  inputParameters: inputParameters,
})
