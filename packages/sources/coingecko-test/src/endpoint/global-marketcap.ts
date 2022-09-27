import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequestParams,
  buildGlobalRequestBody,
  constructEntry,
  inputParameters,
  ProviderResponseBody,
} from '../globalUtils'
import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (_, context: AdapterContext): AxiosRequestConfig<never> => {
    return buildGlobalRequestBody(context.adapterConfig.API_KEY)
  },
  parseResponse: (
    params: AdapterRequestParams[],
    res: AxiosResponse<ProviderResponseBody>,
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
