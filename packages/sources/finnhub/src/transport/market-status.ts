import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

import type { BaseEndpointTypes } from '../endpoint/market-status'

export const markets = [
  'AD',
  'AS',
  'AT',
  'AX',
  'BA',
  'BC',
  'BD',
  'BE',
  'BH',
  'BK',
  'BO',
  'BR',
  'CA',
  'CN',
  'CO',
  'CR',
  'CS',
  'DB',
  'DE',
  'DU',
  'F',
  'HE',
  'HK',
  'HM',
  'IC',
  'IR',
  'IS',
  'JK',
  'JO',
  'KL',
  'KQ',
  'KS',
  'KW',
  'L',
  'LS',
  'MC',
  'ME',
  'MI',
  'MT',
  'MU',
  'MX',
  'NE',
  'NL',
  'NS',
  'NZ',
  'OL',
  'PA',
  'PM',
  'PR',
  'QA',
  'RO',
  'RG',
  'SA',
  'SG',
  'SI',
  'SN',
  'SR',
  'SS',
  'ST',
  'SW',
  'SZ',
  'T',
  'TA',
  'TL',
  'TO',
  'TW',
  'TWO',
  'US',
  'V',
  'VI',
  'VN',
  'VS',
  'WA',
  'HA',
  'SX',
  'TG',
  'SC',
] as const

export type Market = (typeof markets)[number]

function isMarket(v: any): v is Market {
  return markets.includes(v as Market)
}

// See: https://finnhub.io/docs/api/market-status
type ResponseBody = {
  data: {
    exchange: string // US
    holiday: string | null // Christmas
    isOpen: boolean // false
    session: string | null // pre-market
    timezone: string // America/New_York
    t: number // 1697018041
  }
}

export type HttpEndpointTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseBody
  }
}

const logger = makeLogger('FinnhubMarketStatusEndpoint')

export const transport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const market = param.market
      if (!isMarket(market)) {
        logger.warn(`Invalid market in params: ${market}`)
        return
      }
      const requestConfig = {
        baseURL: `${settings.API_ENDPOINT}/stock/market-status`,
        method: 'GET',
        params: {
          exchange: market,
          token: settings.API_KEY,
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
      const marketStatus = parseMarketStatus(res.data.session)
      return [
        {
          params: param,
          response: {
            result: marketStatus,
            data: {
              result: marketStatus,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(res.data.t),
            },
          },
        },
      ]
    })
  },
})

export function parseMarketStatus(marketStatus: string): MarketStatus {
  if (marketStatus === 'regular') {
    return MarketStatus.OPEN
  }
  return MarketStatus.CLOSED
}
