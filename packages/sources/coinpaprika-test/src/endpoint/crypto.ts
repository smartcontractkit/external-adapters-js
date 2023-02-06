import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedRequestBody,
  constructEntry,
  EndpointTypes,
  inputParameters,
} from '../crypto-utils'

const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<EndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res.data, requestPayload, 'price')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  aliases: ['price'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
