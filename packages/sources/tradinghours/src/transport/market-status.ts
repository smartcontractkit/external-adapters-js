import {
  MarketStatus,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'

import type { BaseEndpointTypes } from '../endpoint/market-status'

import type { Market } from './utils'
import { getFinId, isMarket } from './utils'

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
      finIds.push(getFinId(market, param.type))
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
      const finId = getFinId(param.market as Market, param.type)
      if (!finId || !(finId in res.data.data)) {
        logger.warn(`Market data not found in response: ${param.market} (fin_id=${finId})`)
        return []
      }

      const marketStatus = parseMarketStatus(
        param,
        res.data.data[finId].status,
        res.data.data[finId].reason,
      )
      return [
        {
          params: param,
          response: {
            result: marketStatus.status,
            data: {
              result: marketStatus.status,
              statusString: marketStatus.string,
            },
          },
        },
      ]
    })
  },
})

const OPEN = 'Open'
const CLOSE = 'Closed'
const REGULAR = 'PRIMARYTRADINGSESSION'
const PRE = 'PRETRADINGSESSION'
const POST = 'POSTTRADINGSESSION'
const OVERNIGHT = 'OVERNIGHT'

export function parseMarketStatus(
  param: TypeFromDefinition<BaseEndpointTypes['Parameters']>,
  status: string,
  reason?: string | null,
) {
  switch (param.type) {
    case 'regular': {
      let result = MarketStatus.UNKNOWN
      if (status === OPEN) {
        result = MarketStatus.OPEN
      } else if (status === CLOSE) {
        result = MarketStatus.CLOSED
      } else {
        logger.warn(`Unexpected status value: ${status}, reason: ${reason}`)
      }

      return {
        status: result,
        string: MarketStatus[result],
      }
    }
    case '24/5': {
      reason = reason?.toUpperCase().replace(/[\s-]+/g, '') // All hyphens and spaces

      let result = TwentyfourFiveMarketStatus.UNKNOWN
      if (isWeekendNow(param.weekend)) {
        result = TwentyfourFiveMarketStatus.WEEKEND
      } else if (reason?.includes(REGULAR)) {
        result = TwentyfourFiveMarketStatus.REGULAR
      } else if (status === CLOSE) {
        if (reason?.includes(PRE)) {
          result = TwentyfourFiveMarketStatus.PRE_MARKET
        } else if (reason?.includes(POST)) {
          result = TwentyfourFiveMarketStatus.POST_MARKET
        } else if (reason?.includes(OVERNIGHT)) {
          result = TwentyfourFiveMarketStatus.OVERNIGHT
        } else {
          result = TwentyfourFiveMarketStatus.WEEKEND
        }
      } else {
        logger.warn(`Unexpected status value: ${status}, reason: ${reason}`)
      }

      return {
        status: result,
        string: TwentyfourFiveMarketStatus[result],
      }
    }
  }
}
