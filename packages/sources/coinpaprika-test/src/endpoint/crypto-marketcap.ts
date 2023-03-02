import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedRequestBody,
  constructEntry,
  EndpointTypes,
  inputParameters,
} from '../crypto-utils'
import overrides from '../config/overrides.json'

const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<EndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res.data, requestPayload, 'market_cap')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'marketcap',
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.coinpaprika,
})
