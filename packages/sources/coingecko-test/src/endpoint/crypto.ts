import { AxiosRequestConfig, AxiosResponse } from 'axios'

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

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): AxiosRequestConfig<ProviderRequestBody> => {
    return buildBatchedRequestBody(params, context.adapterConfig)
  },
  parseResponse: (
    params: CryptoRequestParams[],
    res: AxiosResponse<ProviderResponseBody>,
  ): ProviderResult<CryptoRequestParams>[] => {
    const entries = [] as ProviderResult<CryptoRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, requestPayload.quote?.toLowerCase() || '')
      if (entry) {
        entries.push({
          ...entry,
          params: {
            ...entry.params,
            market: 'coingecko',
          },
        })
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'crypto',
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
