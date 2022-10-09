import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  BatchWarmingTransport,
  HttpRequestConfig,
  HttpResponse,
} from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  CryptoRequestParams,
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  cryptoInputParams,
} from '../crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): HttpRequestConfig<ProviderRequestBody> => {
    const requestBody = buildBatchedRequestBody(params, context.adapterConfig)
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
