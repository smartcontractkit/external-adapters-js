import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  buildGlobalRequestBody,
  AdapterRequestParams,
  ProviderResponseBody,
  constructEntry,
  inputParameters,
} from '../global-utils'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (_: AdapterRequestParams[], config: AdapterConfig): HttpRequestConfig<never> => {
    return buildGlobalRequestBody(config.API_KEY)
  },
  parseResponse: (
    params: AdapterRequestParams[],
    res: HttpResponse<ProviderResponseBody>,
  ): ProviderResult<AdapterRequestParams>[] => {
    const entries = [] as ProviderResult<AdapterRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, 'total_market_cap')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  aliases: ['total_market_cap'],
  transport: batchEndpointTransport,
  inputParameters,
})
