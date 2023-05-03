import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../config'
const logger = makeLogger('TradinEconomics HTTP')

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
export interface ProviderRequestBody {
  events: string
  symbols: string
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

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = param
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: `/symbol/${symbol.base}`,
        params: {
          c: `${config.API_CLIENT_KEY}:${config.API_CLIENT_SECRET}`,
          f: `json`,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    const entry = {
      params: params[0],
    }
    if (!res.data) {
      const errorMessage = `Tradingeconomics provided no data for "${params[0].base}"`
      logger.warn(errorMessage)
      return [
        {
          ...entry,
          response: {
            statusCode: 502,
            errorMessage,
          },
        },
      ]
    }
    return res.data.map((r) => {
      return {
        ...entry,
        response: {
          data: {
            result: r.Last,
          },
          result: r.Last,
        },
      }
    })
  },
})
