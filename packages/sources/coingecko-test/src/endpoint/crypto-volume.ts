import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'

import {
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  CryptoRequestParams,
  cryptoInputParams,
} from '../cryptoUtils'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): AxiosRequestConfig<ProviderRequestBody> => {
    const requestBody = buildBatchedRequestBody(params, context.adapterConfig)
    requestBody.params.include_24hr_vol = true
    return requestBody
  },
  parseResponse: (
    params: CryptoRequestParams[],
    res: AxiosResponse<ProviderResponseBody>,
  ): ProviderResult<CryptoRequestParams>[] => {
    const entries = [] as ProviderResult<CryptoRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(
        res,
        requestPayload,
        `${requestPayload.quote.toLowerCase()}_24h_vol`,
      )
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'volume',
  aliases: ['crypto-volume'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
