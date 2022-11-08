import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { buildBatchedRequestBody, constructEntry, EndpointTypes } from '../crypto-utils'
import { cryptoInputParams } from '@chainlink/external-adapter-framework/examples/coingecko/src/crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport<EndpointTypes>({
  prepareRequest: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<EndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, 'price')
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
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
