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
    return constructEntry(params, res.data, 'volume_24h')
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'volume',
  transport: httpTransport,
  inputParameters: inputParameters,
})
