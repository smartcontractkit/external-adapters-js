import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

import type { BaseEndpointTypes } from '../endpoint/market-status'

export const markets = ['NYSE', 'US'] as const

export type Market = (typeof markets)[number]

const marketToExchange: Record<Market, string> = {
  NYSE: 'US',
  US: 'US',
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
      const market = marketToExchange[param.market as Market]
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
      const marketStatus = parseMarketStatus(res.data?.session)

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
