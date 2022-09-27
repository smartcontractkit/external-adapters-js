import { AxiosRequestConfig, AxiosResponse } from 'axios'

import {
  buildGlobalRequestBody,
  AdapterRequestParams,
  ProviderResponseBody,
  constructEntry,
  inputParameters,
} from '../globalUtils'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterContext, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    _: AdapterRequestParams[],
    context: AdapterContext,
  ): AxiosRequestConfig<never> => {
    return buildGlobalRequestBody(context.adapterConfig.API_KEY)
  },
  parseResponse: (
    params: AdapterRequestParams[],
    res: AxiosResponse<ProviderResponseBody>,
  ): ProviderResult<AdapterRequestParams>[] => {
    const entries = [] as ProviderResult<AdapterRequestParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload, 'market_cap_percentage')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'dominance',
  aliases: ['market_cap_percentage'],
  transport: batchEndpointTransport,
  inputParameters,
})
