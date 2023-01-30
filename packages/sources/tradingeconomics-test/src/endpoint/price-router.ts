import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './price-ws'
import { customSettings } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { httpTransport } from './price'
import {
  PriceEndpoint,
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'

export const inputParameters: PriceEndpointInputParameters = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
} as const

export interface ProviderRequestBody {
  events: string
  symbols: string
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody[]
  }
}

export interface ProviderResponseBody {
  Symbol: string
  Ticker: string
  Name: string
  Country: string
  Date: string
  Type: string
  decimals: number
  state: string
  Last: number
  Close: number
  CloseDate: string
  MarketCap: number | null
  URL: string
  Importance: number
  DailyChange: number
  DailyPercentualChange: number
  WeeklyChange: number
  WeeklyPercentualChange: number
  MonthlyChange: number
  MonthlyPercentualChange: number
  YearlyChange: number
  YearlyPercentualChange: number
  YTDChange: number
  YTDPercentualChange: number
  day_high: number
  day_low: number
  yesterday: number
  lastWeek: number
  lastMonth: number
  lastYear: number
  startYear: number
  ISIN: string | null
  frequency: string
  LastUpdate: string
}

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    REST: httpTransport,
    WS: wsTransport,
  },
  (_, adapterConfig) => {
    if (adapterConfig.WS_ENABLED) {
      return 'WS'
    }
    return 'REST'
  },
)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['forex'],
  transport: routingTransport,
  inputParameters,
})
