import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildGlobalRequestBody,
  constructEntry,
  GlobalEndpointTypes,
  inputParameters,
} from '../global-utils'
import overrides from '../config/overrides.json'

const httpTransport = new HttpTransport<GlobalEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildGlobalRequestBody(params, config)
  },
  parseResponse: (params, res): ProviderResult<GlobalEndpointTypes>[] => {
    const entries = [] as ProviderResult<GlobalEndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res.data, requestPayload, '_dominance_percentage')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'dominance',
  transport: httpTransport,
  inputParameters,
  overrides: overrides.coinpaprika,
})
