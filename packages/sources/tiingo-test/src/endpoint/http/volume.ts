import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import overrides from '../../config/overrides.json'
import {
  buildBatchedRequestBody,
  constructEntry,
  HttpTransportTypes,
  inputParameters,
} from '../../crypto-utils'

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/prices')
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'volumeNotional')
  },
})

export const endpoint = new PriceEndpoint({
  name: 'volume',
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
