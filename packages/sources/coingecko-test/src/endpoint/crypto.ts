import {
  CryptoRequestParams,
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  cryptoInputParams,
} from '../crypto-utils'

import {
  BatchWarmingTransport,
  HttpRequestConfig,
  HttpResponse,
} from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterContext, PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

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

export const endpoint = new PriceEndpoint({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
