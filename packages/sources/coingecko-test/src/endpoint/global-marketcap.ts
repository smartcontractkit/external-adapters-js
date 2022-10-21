import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpRequestConfig } from '@chainlink/external-adapter-framework/transports'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  buildGlobalRequestBody,
  constructEntry,
  GlobalEndpointTypes,
  inputParameters,
} from '../global-utils'

const batchEndpointTransport = new BatchWarmingTransport<GlobalEndpointTypes>({
  prepareRequest: (params, config): HttpRequestConfig<never> => {
    return buildGlobalRequestBody(config.API_KEY)
  },
  parseResponse: (params, res): ProviderResult<GlobalEndpointTypes>[] => {
    const entries = [] as ProviderResult<GlobalEndpointTypes>[]
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
