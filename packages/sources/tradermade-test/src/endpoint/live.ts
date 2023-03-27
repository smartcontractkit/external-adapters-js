import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { buildBatchedRequestBody, constructEntry, HttpTransportTypes } from '../price-utils'

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
} satisfies InputParameters

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})

export const endpoint = new AdapterEndpoint<HttpTransportTypes>({
  name: 'live',
  aliases: ['stock', 'commodities'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
