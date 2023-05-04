import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ResponseSchema, buildIndividualRequests, constructEntry } from '../price-utils'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

export const inputParameters = new InputParameters({
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
})

export type LiveEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<LiveEndpointTypes>({
  prepareRequests: (params, config) => buildIndividualRequests(params, config),
  parseResponse: (params, res) => constructEntry(res.data, params),
})

export const endpoint = new AdapterEndpoint<LiveEndpointTypes>({
  name: 'live',
  aliases: ['stock', 'commodities'],
  transport: httpTransport,
  inputParameters,
})
