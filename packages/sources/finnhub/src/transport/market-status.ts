import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

import type { BaseEndpointTypes } from '../endpoint/market-status'

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
      const market = param.market
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: `/stock/market-status`,
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

      return {
        params: param,
        response: {
          result: marketStatus,
          data: {
            result: marketStatus,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.t ? new Date(res.data.t).getTime() : 0,
          },
        },
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
