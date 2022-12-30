import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchEndpointTypes, buildBatchedRequestBody, constructEntry } from '../price-utils'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} as const

export const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'forex',
  aliases: ['batch'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
