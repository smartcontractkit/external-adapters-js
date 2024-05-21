import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, constructEntry, HttpTransportTypes } from './utils'

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = []
    for (const requestPayload of params) {
      const entry = constructEntry(requestPayload, res.data, 'VOLUME24HOURTO')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})
