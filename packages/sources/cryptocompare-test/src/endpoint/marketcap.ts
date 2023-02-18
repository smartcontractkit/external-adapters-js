import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedRequestBody,
  constructEntry,
  BatchEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

export const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = []
    for (const requestPayload of params) {
      const entry = constructEntry(requestPayload, res.data, 'MKTCAP')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'marketcap',
  transport: httpTransport,
  inputParameters: cryptoInputParams,
})
