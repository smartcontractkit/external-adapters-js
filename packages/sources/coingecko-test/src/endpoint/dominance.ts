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
    params.map((requestPayload) =>
      constructEntry(res.data, requestPayload, 'market_cap_percentage'),
    ),
})

export const endpoint = new AdapterEndpoint({
  name: 'dominance',
  aliases: ['market_cap_percentage'],
  transport,
  inputParameters,
})
