import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildGlobalRequestBody,
  constructEntry,
  GlobalEndpointTypes,
  inputParameters,
} from '../global-utils'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

const transport = new HttpTransport<GlobalEndpointTypes>({
  prepareRequests: (params, config) => buildGlobalRequestBody(params, config),
  parseResponse: (params, res) =>
    params.map((requestPayload) => constructEntry(res.data, requestPayload, 'total_market_cap')),
})

export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  aliases: ['total_market_cap'],
  transport,
  inputParameters,
})
