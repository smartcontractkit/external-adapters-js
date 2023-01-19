import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { httpTransport } from './price'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from './price-ws'

export const inputParameters = {
  base: {
    aliases: ['from', 'asset'],
    description: 'The symbol of the asset to query',
    type: 'string',
    required: true,
  },
} as const

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
    RequestBody: unknown
    ResponseBody: ProviderResponseBody
  }
}

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    WS: wsTransport,
    REST: httpTransport,
  },
  (_, adapterConfig) => {
    if (adapterConfig.WS_ENABLED) {
      return 'WS'
    }
    return 'REST'
  },
)

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'price',
  transport: routingTransport,
  inputParameters: inputParameters,
})
