import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

import type { BaseEndpointTypes } from '../endpoint/market-status'

export const marketAliases = ['NYSE'] as const

export type Market = (typeof marketAliases)[number]

const marketToExchange: Record<Market, string> = {
  NYSE: 'US',
}

// See: https://finnhub.io/docs/api/market-status
type ResponseBody = {
  exchange: string // US
  holiday: string | null // Christmas
  isOpen: boolean // false
  session: string | null // pre-market
  timezone: string // America/New_York
  t: number // 1697018041
}

export type HttpEndpointTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseBody
  }
}

export const transport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const market = marketAliases.includes(param.market)
        ? marketToExchange[param.market as Market]
        : param.market
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: '/stock/market-status',
        method: 'GET',
        params: {
          exchange: market,
          token: config.API_KEY,
        },
      }
      return {
        params: [param],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      // Check if res.data exists and if every value in res.data is null
      const allNull =
        !res.data || Object.values(res.data).every((value) => value === null || value === '')

      // Set marketStatus to unknown if allNull is true, otherwise parse normally
      const marketStatus = allNull ? MarketStatus.UNKNOWN : parseMarketStatus(res.data?.session)

      const response: any = {
        result: marketStatus,
        data: {
          result: marketStatus,
        },
      }

      if (res.data?.t) {
        response.timestamps = {
          providerIndicatedTimeUnixMs: new Date(res.data.t * 1000).getTime(),
        }
      }

      return {
        params: param,
        response,
      }
    })
  },
})

export function parseMarketStatus(marketStatus: string | null | undefined): MarketStatus {
  if (marketStatus === undefined) {
    return MarketStatus.UNKNOWN
  }
  return marketStatus === 'regular' ? MarketStatus.OPEN : MarketStatus.CLOSED
}
