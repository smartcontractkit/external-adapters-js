import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './price-ws'
import { customSettings } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { batchTransport } from './price'

export const inputParameters = {
  base: {
    aliases: ['from', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'term'],
    description: 'The quote symbol of the asset to query',
    type: 'string',
    default: 'USD',
  },
} as const

export interface RequestParams {
  base: string
  quote: string
}

export interface ProviderRequestBody {
  events: string
  symbols: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
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
    REST: batchTransport,
    WS: wsTransport,
  },
  (_, adapterConfig) => {
    if (adapterConfig?.WS_ENABLED) {
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
