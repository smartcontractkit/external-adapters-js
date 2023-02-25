import { customSettings } from '../config'
import { httpTransport } from './http/crypto'
import {
  CryptoPriceEndpoint,
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './ws/crypto-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

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
  transport: {
    description: 'which transport to route to',
    required: false,
    type: 'string',
    default: 'rest',
  },
} satisfies InputParameters & PriceEndpointInputParameters

interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
  error?: string
}

export type CryptoEndpointParams = PriceEndpointParams & {
  transport: string
}

export type EndpointTypes = {
  Request: {
    Params: CryptoEndpointParams
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
    ws: wsTransport,
    rest: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'ws' : 'rest'),
)

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transport: routingTransport,
  inputParameters: inputParameters,
})
