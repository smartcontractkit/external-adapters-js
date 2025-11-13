import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'

import type { BaseEndpointTypes } from '../endpoint/market-status'

export const marketAliases = [
  'NYSE',
  'LSE',
  'XETRA',
  'SIX',
  'EURONEXT_MILAN',
  'EURONEXT_PARIS',
] as const

export type Market = (typeof marketAliases)[number]

const marketToExchange: Record<Market, string> = {
  NYSE: 'US',
  LSE: 'L',
  XETRA: 'DE',
  SIX: 'SW',
  EURONEXT_MILAN: 'MI',
  EURONEXT_PARIS: 'PA',
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
      const market = marketAliases.includes(param.market as Market)
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
      const marketStatus = parseMarketStatus(param, res?.data)

      const response = {
        result: marketStatus.status,
        data: {
          result: marketStatus.status,
          statusString: marketStatus.string,
        },
        timestamps: res.data?.t
          ? {
              providerIndicatedTimeUnixMs: new Date(res.data.t * 1000).getTime(),
            }
          : undefined,
      }

      return {
        params: param,
        response,
      }
    })
  },
})

export function parseMarketStatus(
  param: TypeFromDefinition<BaseEndpointTypes['Parameters']>,
  data?: ResponseBody,
) {
  switch (param.type) {
    case 'regular': {
      // Check if data exists and if every value in data is null
      const allNull = !data || Object.values(data).every((value) => value === null || value === '')
      // Set marketStatus to unknown if allNull is true, otherwise parse normally
      const status =
        allNull || data?.session === undefined
          ? MarketStatus.UNKNOWN
          : data?.session === 'regular'
          ? MarketStatus.OPEN
          : MarketStatus.CLOSED

      return {
        status,
        string: MarketStatus[status],
      }
    }
    case '24/5': {
      const session = data?.session?.toUpperCase().trim()
      let status = TwentyfourFiveMarketStatus.UNKNOWN

      if (isWeekendNow(param.weekend)) {
        status = TwentyfourFiveMarketStatus.WEEKEND
      } else if (!session) {
        status = TwentyfourFiveMarketStatus.OVERNIGHT
      } else {
        status = TwentyfourFiveMapping[session] ?? TwentyfourFiveMarketStatus.UNKNOWN
      }

      return {
        status,
        string: TwentyfourFiveMarketStatus[status],
      }
    }
  }
}

const TwentyfourFiveMapping: Record<string, TwentyfourFiveMarketStatus> = {
  REGULAR: TwentyfourFiveMarketStatus.REGULAR,
  'PRE-MARKET': TwentyfourFiveMarketStatus.PRE_MARKET,
  'POST-MARKET': TwentyfourFiveMarketStatus.POST_MARKET,
}
