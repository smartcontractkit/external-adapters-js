import {
  MarketStatusResultResponse,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TZDate } from '@date-fns/tz'

type Response = {
  data: {
    result: {
      status: MarketStatusResultResponse['Result']
      statusString: string
      time: string
    }[]
  }
  statusCode: number
}

// A single market-session transition (a point in time when the market enters a session
// phase), used for session-start gating. Unlike getSessions below this keeps every
// status (including REGULAR) and Sunday overnight transitions: gating needs the start
// of whichever session is active, while smoothing deliberately skips some transitions.
export type SessionTransition = {
  status: TwentyfourFiveMarketStatus
  timeMs: number
}

export const getSessionTransitions = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
): Promise<SessionTransition[]> =>
  fetchSessionSchedule(
    tradingHoursUrl,
    requester,
    sessionBoundariesTimeZone,
    sessionMarket,
    sessionMarketType,
  )

export const getSessions = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
): Promise<number[]> => {
  const transitions = await fetchSessionSchedule(
    tradingHoursUrl,
    requester,
    sessionBoundariesTimeZone,
    sessionMarket,
    sessionMarketType,
  )
  return processData(transitions, sessionBoundariesTimeZone)
}

const fetchSessionSchedule = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
): Promise<SessionTransition[]> => {
  const requestConfig = {
    baseURL: tradingHoursUrl,
    method: 'POST',
    data: {
      data: {
        endpoint: 'market-session',
        market: sessionMarket,
        type: sessionMarketType,
        timezone: sessionBoundariesTimeZone,
      },
    },
  }

  try {
    const response = await requester.request<Response>(JSON.stringify(requestConfig), requestConfig)

    const data = response?.response?.data
    if (!data || !data?.data?.result) {
      throw new AdapterError({
        statusCode: data?.statusCode || 500,
        message: `TradingHours EA request failed: ${JSON.stringify(response?.response?.data)} ${
          response?.response?.status
        } ${response?.response?.statusText}`,
      })
    }
    return data.data.result.map((d) => ({
      status: d.status as TwentyfourFiveMarketStatus,
      timeMs: new TZDate(d.time, sessionBoundariesTimeZone).getTime(),
    }))
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `TradingHoursEA request failed: ${e.message} ${
        JSON.stringify(e?.errorResponse) || e.name
      }`
    }
    throw e
  }
}

const processData = (transitions: SessionTransition[], timezone: string): number[] =>
  transitions
    .filter(
      (d) =>
        d.status === TwentyfourFiveMarketStatus.PRE_MARKET ||
        d.status === TwentyfourFiveMarketStatus.POST_MARKET ||
        d.status === TwentyfourFiveMarketStatus.OVERNIGHT,
    )
    .map((d) => ({ status: d.status, time: new TZDate(d.timeMs, timezone) }))
    .filter(
      (d) =>
        // Skip Sunday Overnight because we don't want to use stale weekend data to smooth
        !(d.status === TwentyfourFiveMarketStatus.OVERNIGHT && d.time.getDay() === 0),
    )
    .map((d) => d.time.getTime())
