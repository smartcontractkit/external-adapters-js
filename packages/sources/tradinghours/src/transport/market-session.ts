import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

import type { BaseEndpointTypes } from '../endpoint/market-session'

import { TZDate } from '@date-fns/tz'
import type { Market } from './utils'
import { getFinId, isMarket } from './utils'

// See: https://docs.tradinghours.com/3.x/enterprise/trading-hours#multiple-day-trading-hours-api
type ResponseBody = {
  data: {
    start: string // 2022-02-20
    end: string // 2022-02-27
    schedule: {
      phase_type: string // Pre-Close
      phase_name: string // Pre Closing
      phase_memo: string | null
      status: string // Closed
      start: string // 2022-02-21T05:25:00+09:00
      end: string // 2022-02-21T05:29:00+09:00
    }[]
  }
}

export type HttpEndpointTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseBody
  }
}

const logger = makeLogger('TradingHoursMarketSessionEndpoint')

export const transport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, config) =>
    params
      .filter((param) => {
        if (!isMarket(param.market)) {
          logger.warn(`Invalid market in params: ${param.market}`)
          return false
        }
        return true
      })
      .map((param) => {
        const now = TZDate.tz(param.timezone)
        return {
          params: [param],
          request: {
            baseURL: config.API_ENDPOINT,
            url: '/v3/markets/hours-multiday',
            headers: {
              Authorization: `Bearer ${config.API_KEY}`,
            },
            params: {
              fin_id: getFinId(param.market as Market, param.type),
              start: formatDate(now, -1),
              end: formatDate(now, 1),
              param,
            },
          },
        }
      }),
  parseResponse: (_, res) => {
    return [
      {
        params: res.config.params.param,
        response: {
          result: null,
          data: {
            result: parseMarketSession(res.data),
          },
        },
      },
    ]
  },
})

const OTHER = 'OTHER'
const REGULAR = 'PRIMARYTRADINGSESSION'
const PRE = 'PRETRADINGSESSION'
const POST = 'POSTTRADINGSESSION'
const OVERNIGHT = 'OVERNIGHT'

const parseMarketSession = (data: ResponseBody) =>
  data.data.schedule
    .map((s) => {
      const type = s.phase_type.toUpperCase().replace(/[\s-]+/g, '') // All hyphens and spaces
      const name = s.phase_name.toUpperCase().replace(/[\s-]+/g, '') // All hyphens and spaces

      let status = TwentyfourFiveMarketStatus.UNKNOWN
      if (type.includes(OTHER) && name.includes(OVERNIGHT)) {
        status = TwentyfourFiveMarketStatus.OVERNIGHT
      } else if (type.includes(PRE)) {
        status = TwentyfourFiveMarketStatus.PRE_MARKET
      } else if (type.includes(REGULAR)) {
        status = TwentyfourFiveMarketStatus.REGULAR
      } else if (type.includes(POST)) {
        status = TwentyfourFiveMarketStatus.POST_MARKET
      }
      return {
        status,
        statusString: TwentyfourFiveMarketStatus[status],
        time: s.start,
      }
    })
    .filter((r) => r.status !== TwentyfourFiveMarketStatus.UNKNOWN)

const formatDate = (date: TZDate, delta: number) => {
  const newDate = new TZDate(date.getTime(), date.timeZone)
  newDate.setDate(newDate.getDate() + delta)

  // YYYY-MM-DD
  return newDate.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
