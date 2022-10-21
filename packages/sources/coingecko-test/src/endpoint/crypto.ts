import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport<CryptoEndpointTypes>({
  prepareRequest: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<CryptoEndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, requestPayload.quote.toLowerCase())
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
