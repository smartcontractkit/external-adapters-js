import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
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
    const requestBody = buildBatchedRequestBody(params, config)
    requestBody.params.include_24hr_vol = true
    return requestBody
  },
  parseResponse: (
    params: CryptoRequestParams[],
    res: HttpResponse<ProviderResponseBody>,
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
