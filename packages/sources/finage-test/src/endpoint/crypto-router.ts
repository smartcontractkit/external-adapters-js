import { customSettings } from '../config'
import { httpTransport } from './http/crypto'
import {
  CryptoPriceEndpoint,
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './ws/crypto-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
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
} satisfies InputParameters & PriceEndpointInputParameters

interface ResponseSchema {
  symbol: string
  price: number
  timestamp: number
  error?: string
}

export type CryptoEndpointParams = PriceEndpointParams

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

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.finage,
})
