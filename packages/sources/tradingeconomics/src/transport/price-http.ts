import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TradingEconomics HTTP Price')

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

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = `${param.base}${param.quote}:CUR`.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/symbol/${symbol}`,
          params: {
            c: `${config.API_CLIENT_KEY}:${config.API_CLIENT_SECRET}`,
            f: `json`,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    const data = res.data[0]
    return params.map((param) => {
      if (!res.data || !data || data.Last === undefined) {
        const message = `Tradingeconomics provided no data for ${JSON.stringify(param)}`
        logger.info(message)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: message,
          },
        }
      }
      return {
        params: param,
        response: {
          data: {
            result: data.Last,
          },
          result: data.Last,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(data.Date).getTime(),
          },
        },
      }
    })
  },
})
