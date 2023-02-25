import { customSettings } from '../config'
import { httpTransport } from './http/stock'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './ws/stock-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
  transport: {
    description: 'which transport to route to',
    required: false,
    type: 'string',
    default: 'rest',
  },
} satisfies InputParameters

export interface StockEndpointParams {
  base: string
  transport: string
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

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    ws: wsTransport,
    rest: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'ws' : 'rest'),
)

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'stock',
  transport: routingTransport,
  inputParameters: inputParameters,
})
