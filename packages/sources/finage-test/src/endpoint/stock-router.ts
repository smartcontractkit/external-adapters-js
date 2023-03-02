import { customSettings } from '../config'
import { httpTransport } from './http/stock'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './ws/stock-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import overrides from '../config/overrides.json'

export const inputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
} satisfies InputParameters

export interface StockEndpointParams {
  base: string
}

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  asize: number
  bsize: number
  timestamp: number
}

export type EndpointTypes = {
  Request: {
    Params: StockEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema[]
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'stock',
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.finage,
})
