import { PriceEndpointInputParameters } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { BatchEndpointTypes, buildBatchedRequestBody, constructEntry } from '../price-utils'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} satisfies InputParameters & PriceEndpointInputParameters

export const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})
