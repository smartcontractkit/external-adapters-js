import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { tz, TZDate } from '@date-fns/tz'
import { ContextFn, format, isValid, isWithinInterval, parse, startOfDay } from 'date-fns'
import https from 'https'
import { BaseEndpointTypes } from '../endpoint/market-status'

type Timezone = ContextFn<TZDate>

export interface GraphqlRequest {
  query: string
  variables: {
    ids: string[]
  }
}

type Holiday =
  | {
      date: string
      extraordinaryTradingDay: true
      extraordinaryOpeningTime: string
      extraordinaryClosingTime: string
    }
  | {
      date: string
      extraordinaryTradingDay: false
      extraordinaryOpeningTime: null
      extraordinaryClosingTime: null
    }

export interface ResponseSchema {
  data: {
    markets: {
      referenceData: {
        marketBase: {
          bc: number | string
          tradingDays: string[]
          marketTimeZone: string
          marketOpenTime: string
          marketCloseTime: string
        }
        marketHolidays: Holiday[]
      }
    }[]
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: GraphqlRequest
    ResponseBody: ResponseSchema
  }
}

export class MarketStatusHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super({
      prepareRequests: (params, config) => {
        return {
          params,
          request: {
            method: 'POST',
            baseURL: config.API_ENDPOINT,
            url: '/web/v2/graphql',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            data: {
              query: marketStatusGraphqlQuery,
              variables: {
                ids: params.map((p) => p.market).sort(),
              },
            },
            httpsAgent: new https.Agent({
              cert: config.PUBLIC_CERT,
              key: config.PRIVATE_KEY,
            }),
          },
        }
      },
      parseResponse: (params, response) => {
        if (!response.data?.data?.markets) {
          return params.map((param) => ({
            params: param,
            response: {
              errorMessage: `The data provider didn't return any value for ${param.market}`,
              statusCode: 502,
            },
          }))
        }

        return params.map((param) => {
          try {
            const result = getMarketStatusResult(param.market, response.data.data.markets)
            return {
              params: param,
              response: {
                result: result.result,
                data: result,
              },
            }
          } catch (error) {
            const statusCode = error instanceof AdapterError ? error.statusCode : 502
            const errorMessage = error instanceof Error ? error.message : String(error)
            return {
              params: param,
              response: {
                errorMessage,
                statusCode,
              },
            }
          }
        })
      },
    })
  }
}

export const marketStatusGraphqlQuery = `
  query MarketBase($ids: [UserInputId!]!) {
    markets(scheme: BC, ids: $ids) {
      referenceData {
        marketBase {
          bc
          tradingDays
          marketTimeZone
          marketOpenTime
          marketCloseTime
        }
        marketHolidays {
          date
          extraordinaryTradingDay
          extraordinaryOpeningTime
          extraordinaryClosingTime
        }
      }
    }
  }`.replace(/\s+/g, ' ')

const getMarketStatusResult = (
  market: string,
  responseMarkets: ResponseSchema['data']['markets'],
) => {
  const result = getMarketStatus(market, responseMarkets)

  return {
    result,
    statusString: MarketStatus[result],
  }
}

const getMarketStatus = (market: string, responseMarkets: ResponseSchema['data']['markets']) => {
  const referenceData = responseMarkets.find(
    (m) => m.referenceData.marketBase.bc?.toString() === market,
  )?.referenceData

  if (!referenceData) {
    const foundMarkets = responseMarkets
      .map((m) => m.referenceData.marketBase.bc?.toString())
      .join(', ')
    throw new AdapterError({
      statusCode: 502,
      message: `Market '${market}' not found in response. Found: ${foundMarkets}`,
    })
  }

  const timezone = tz(referenceData.marketBase.marketTimeZone)
  const now = Date.now()
  const today = startOfDay(now, { in: timezone })

  const openAndCloseTime = getOpenAndCloseTimeFor(today, referenceData)
  if (!openAndCloseTime) {
    return MarketStatus.CLOSED
  }
  const { openTime, closeTime } = openAndCloseTime

  const start = parseTimeOfDay({ timeStr: openTime, day: today, timezone })
  const end = parseTimeOfDay({ timeStr: closeTime, day: today, timezone })
  if (isWithinInterval(now, { start, end })) {
    return MarketStatus.OPEN
  } else {
    return MarketStatus.CLOSED
  }
}

const getOpenAndCloseTimeFor = (
  today: TZDate,
  referenceData: ResponseSchema['data']['markets'][0]['referenceData'],
): { openTime: string; closeTime: string } | undefined => {
  const todayString = format(today, 'yyyy-MM-dd')
  const holiday = referenceData.marketHolidays.find((h) => h.date === todayString)

  if (holiday !== undefined) {
    if (!holiday.extraordinaryTradingDay) {
      return undefined
    }

    return {
      openTime: holiday.extraordinaryOpeningTime,
      closeTime: holiday.extraordinaryClosingTime,
    }
  }

  const tradingDays = referenceData.marketBase.tradingDays.map((d) => d.toUpperCase())
  const dayOfWeek = format(today, 'EEEE').toUpperCase()

  if (!tradingDays.includes(dayOfWeek)) {
    return undefined
  }

  return {
    openTime: referenceData.marketBase.marketOpenTime,
    closeTime: referenceData.marketBase.marketCloseTime,
  }
}

const parseTimeOfDay = ({
  timeStr,
  day,
  timezone,
}: {
  timeStr: string
  day: TZDate
  timezone: Timezone
}): TZDate => {
  const timeFormat = 'HH:mm:ss'
  const time = parse(timeStr, timeFormat, day, { in: timezone })
  if (!isValid(time)) {
    throw new AdapterError({
      statusCode: 502,
      message: `Invalid time format: '${timeStr}', expected '${timeFormat}'`,
    })
  }
  return time
}

export const httpTransport = new MarketStatusHttpTransport()
