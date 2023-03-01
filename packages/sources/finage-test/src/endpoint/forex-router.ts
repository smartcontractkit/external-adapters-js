import { customSettings } from '../config'
import { httpTransport } from './http/forex'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './ws/forex-ws'
import overrides from '../config/overrides.json'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'symbol'],
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

interface ResponseSchema {
  symbol: string
  bid: number
  ask: number
  timestamp: number
}

export type ForexEndpointParams = PriceEndpointParams

export type EndpointTypes = {
  Request: {
    Params: ForexEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'forex',
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.finage,
})
