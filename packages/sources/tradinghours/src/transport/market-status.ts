import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

import type { BaseEndpointTypes } from '../endpoint/market-status'

export const markets = ['forex', 'metals', 'wti'] as const

export type Market = (typeof markets)[number]

const marketToFinId: Record<Market, string> = {
  forex: 'US.CHNLNK.FX',
  metals: 'US.CHNLNK.METAL',
  wti: 'US.CHNLNK.WTI',
}

function isMarket(v: any): v is Market {
  return markets.includes(v as Market)
}

// See: https://docs.tradinghours.com/3.x/endpoints/market-status.html
type ResponseBody = {
  data: {
    [fin_id: string]: {
      fin_id: string // US.COMEX.METALS.PRECIOUS.GOLD
      exchange: string // Chicago Mercantile Exchange Group
      market: string // Metals - Precious (COMEX)
      products: string // Gold Main
      status: string // Closed
      reason: string | null //
      local_time: string // 2024-05-31T16:37:34-05:00
      until: string // 2024-06-02T16:00:00-05:00
      next_bell: string // 2024-06-02T17:00:00-05:00
    }
  }
  meta: {
    utc_time: string // 2024-05-31T21:37:34+00:00
    time: string // 2024-05-31T21:37:34+00:00
  }
}

export type HttpEndpointTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseBody
  }
}

const logger = makeLogger('TradingHoursMarketStatusEndpoint')

export const transport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, config) => {
    const finIds: string[] = []
    params.forEach((param) => {
      const market = param.market
      if (!isMarket(market)) {
        logger.warn(`Invalid market in params: ${market}`)
        return
      }
      finIds.push(marketToFinId[market])
    })

    return [
      {
        params,
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/v3/markets/status',
          headers: {
            Authorization: `Bearer ${config.API_KEY}`,
          },
          params: {
            fin_id: finIds.join(','),
          },
        },
      },
    ]
  },
  parseResponse: (params, res) => {
    return params.flatMap((param) => {
      const finId = marketToFinId[param.market as Market]
      if (!finId || !(finId in res.data.data)) {
        logger.warn(`Market data not found in response: ${param.market} (fin_id=${finId})`)
        return []
      }

      const marketStatus = parseMarketStatus(res.data.data[finId].status)
      return [
        {
          params: param,
          response: {
            result: marketStatus,
            data: {
              result: marketStatus,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(res.data.meta.time).getTime(),
            },
          },
        },
      ]
    })
  },
})

export function parseMarketStatus(marketStatus: string): MarketStatus {
  if (marketStatus === 'Open') {
    return MarketStatus.OPEN
  }
  if (marketStatus === 'Closed') {
    return MarketStatus.CLOSED
  }
  logger.warn(`Unexpected market status value: ${marketStatus}`)
  return MarketStatus.UNKNOWN
}
