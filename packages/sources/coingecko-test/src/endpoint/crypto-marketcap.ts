import { AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  CryptoRequestParams,
  ProviderRequestBody,
  buildBatchedRequestBody,
  constructEntry,
  ProviderResponseBody,
  cryptoInputParams,
} from '../cryptoUtils'
import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoRequestParams[],
    context: AdapterContext,
  ): AxiosRequestConfig<ProviderRequestBody> => {
    const requestBody = buildBatchedRequestBody(params, context.adapterConfig)
    requestBody.params.include_market_cap = true
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
        `${requestPayload.quote.toLowerCase()}_market_cap`,
      )
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  aliases: ['crypto-marketcap'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
