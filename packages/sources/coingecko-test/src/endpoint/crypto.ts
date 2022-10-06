import {
  CryptoRequestParams,
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  cryptoInputParams,
} from '../cryptoUtils'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterEndpoint, AdapterContext } from '@chainlink/external-adapter-framework/adapter'
import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): HttpRequestConfig<ProviderRequestBody> => {
    return buildBatchedRequestBody(params, context.adapterConfig)
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

export const endpoint = new AdapterEndpoint({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
