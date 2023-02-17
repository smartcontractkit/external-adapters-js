import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { buildBatchedRequestBody, constructEntry, LiveEndpointTypes } from '../price-utils'

const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'symbol', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'convert'],
    required: false,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} as const

export const httpTransport = new HttpTransport<LiveEndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})

export const endpoint = new AdapterEndpoint<LiveEndpointTypes>({
  name: 'live',
  aliases: ['stock', 'commodities'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
