import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  CryptoRequestParams,
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  cryptoInputParams,
} from '../crypto-utils'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    config: AdapterConfig,
  ): HttpRequestConfig<ProviderRequestBody> => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (
    params: CryptoRequestParams[],
    res: HttpResponse<ProviderResponseBody>,
  ): ProviderResult<CryptoRequestParams>[] => {
    const entries = [] as ProviderResult<CryptoRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, requestPayload.quote.toLowerCase())
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new PriceEndpoint({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
