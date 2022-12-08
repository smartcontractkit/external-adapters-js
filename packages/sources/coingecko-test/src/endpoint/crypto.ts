import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport<CryptoEndpointTypes>({
  prepareRequest: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructEntry(res, requestPayload, requestPayload.quote.toLowerCase()),
    ),
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
