import { httpTransport } from './price'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from './price-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = {
  base: {
    aliases: ['from', 'asset'],
    description: 'The symbol of the asset to query',
    type: 'string',
    required: true,
  },
} satisfies InputParameters

export interface RequestParams {
  base: string
}

export interface ProviderResponseBody {
  last_price: number
  last_time: string
  last_size: number
  bid_price: number
  bid_size: number
  ask_price: number
  ask_size: number
  open_price: number
  close_price: number | null
  high_price: number
  low_price: number
  exchange_volume: number | null
  market_volume: number
  updated_on: string | null
  source: string
  security: {
    id: string
    ticker: string
    exchange_ticker: string
    figi: string
    composite_figi: string
  }
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['stock'],
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
})
