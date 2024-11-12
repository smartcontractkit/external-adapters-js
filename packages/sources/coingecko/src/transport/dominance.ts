import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildGlobalRequestBody, constructGlobalEntry, GlobalHttpTransportTypes } from './utils'

export const transport = new HttpTransport<GlobalHttpTransportTypes>({
  prepareRequests: (params, config) => buildGlobalRequestBody(params, config),
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructGlobalEntry(res.data, requestPayload, 'market_cap_percentage'),
    ),
})
