import { config } from '../config'
import { StockBaseEndpointTypes } from '../endpoint/utils'

interface RequestParams {
  base: string
}

interface ResponseSchema {
  avgTotalVolume: number
  calculationPrice: string
  change: number
  changePercent: number
  close: number
  closeSource: string
  closeTime: number
  companyName: string
  currency: string
  delayedPrice: number
  delayedPriceTime: number
  extendedChange: number
  extendedChangePercent: number
  extendedPrice: number
  extendedPriceTime: number
  high: number
  highSource: string
  highTime: number
  iexAskPrice: number
  iexAskSize: number
  iexBidPrice: number
  iexBidSize: number
  iexClose: number
  iexCloseTime: number
  iexLastUpdated: number
  iexMarketPercent: number
  iexOpen: number
  iexOpenTime: number
  iexRealtimePrice: number
  iexRealtimeSize: number
  iexVolume: number
  lastTradeTime: number
  latestPrice: number
  latestSource: string
  latestTime: string
  latestUpdate: number
  latestVolume: number
  low: number
  lowSource: string
  lowTime: number
  marketCap: number
  oddLotDelayedPrice: number
  oddLotDelayedPriceTime: number
  open: number
  openTime: number
  openSource: string
  peRatio: number
  previousClose: number
  previousVolume: number
  primaryExchange: string
  symbol: string
  volume: number
  week52High: number
  week52Low: number
  ytdChange: number
  isUSMarketOpen: boolean
}

export type HttpTransportTypes = StockBaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const buildHttpRequestBody = (params: RequestParams[], c: typeof config.settings) => {
  return params.map((param) => {
    return {
      params: [param],
      request: {
        url: `stock/${param.base.toUpperCase()}/quote`,
        baseURL: c.API_ENDPOINT,
        params: {
          token: c.API_KEY,
        },
      },
    }
  })
}

export const constructEntries = (
  res: ResponseSchema,
  params: RequestParams[],
  resultPath: keyof ResponseSchema,
) => {
  return params.map((param) => {
    const result = Number(res[resultPath])
    if (isNaN(result)) {
      return {
        params: param,
        response: {
          errorMessage: `Iex-Cloud provided no data for base "${param.base}"`,
          statusCode: 502,
        },
      }
    }
    return {
      params: param,
      response: {
        data: {
          result: result,
        },
        result,
      },
    }
  })
}
