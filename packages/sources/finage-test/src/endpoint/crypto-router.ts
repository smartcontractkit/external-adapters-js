import { customSettings } from '../config'
import { httpTransport } from './http/crypto'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './ws/crypto-ws'

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

interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
  error?: string
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transport: routingTransport,
  inputParameters: inputParameters,
})
