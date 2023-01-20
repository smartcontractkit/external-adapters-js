import { customSettings } from '../config'
import { httpTransport } from './http/stock'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './ws/stock-ws'

export const inputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
} as const

interface RequestParams {
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
    Params: RequestParams
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
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'stock',
  transport: routingTransport,
  inputParameters: inputParameters,
})
