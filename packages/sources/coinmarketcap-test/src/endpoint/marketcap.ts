import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  inputParameters,
} from '../crypto-utils'

const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    return constructEntry(params, res.data, 'market_cap')
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'marketcap',
  transport: httpTransport,
  inputParameters: inputParameters,
})
