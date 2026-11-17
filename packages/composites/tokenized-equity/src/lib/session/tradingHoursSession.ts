import {
  MarketStatusResultResponse,
  TwentyfourFiveMarketStatus,
} from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { TZDate } from '@date-fns/tz'

import { CachedValue, getCachedValue } from './transitionCache'

type Response = {
  data: {
    result: {
      status: MarketStatusResultResponse['Result']
      statusString: string
      time: string
      // Additive passthrough of the upstream phase end (tradinghours ADR-0001);
      // absent when talking to a pre-endTime tradinghours deployment.
      endTime?: string
    }[]
  }
  statusCode: number
}

// A single market-session transition (a point in time when the market enters a session
// phase), used for session-start gating. getSessionTransitions keeps every status
// (including REGULAR) and Sunday overnight transitions: gating needs the start of
// whichever session is active, while smoothing deliberately skips some transitions
// (see processData). endTimeMs (when present) is the phase end — 24/7 gating derives
// the start of closed spans (weekends/holidays) from it (tradinghours ADR-0001).
export type SessionTransition = {
  status: TwentyfourFiveMarketStatus
  timeMs: number
  endTimeMs?: number
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

// Max age for a cached schedule (transitionCache.ts). The fetched window only
// reaches ~1 day forward (tradinghours returns [now-5d, now+1d]), so a schedule
// older than this has no new session opens to gate against and must not be served:
// the caller falls through to the hard-coded fallback (source FALLBACK) instead.
// 1h sits well under the ~1-day forward reach while tolerating short outages.
export const SCHEDULE_CACHE_MAX_AGE_MS = 60 * 60 * 1000

// Cached variant (transitionCache.ts): serves the last good schedule and refreshes
// in the background once the TTL elapses, so neither gating path pays a tradinghours
// hop per price request. Only the first fetch for a key blocks — plus any fetch
// after the entry passes SCHEDULE_CACHE_MAX_AGE_MS, which blocks (and throws) like
// the first. The returned entry carries the staleness signal for callers that want
// to react to an old schedule.
export const getSessionTransitionsCached = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone: string,
  sessionMarket: string,
  sessionMarketType: string,
  ttlMs: number,
): Promise<CachedValue<SessionTransition[]>> =>
  getCachedValue(
    [tradingHoursUrl, sessionBoundariesTimeZone, sessionMarket, sessionMarketType].join('|'),
    ttlMs,
    SCHEDULE_CACHE_MAX_AGE_MS,
    () =>
      fetchSessionSchedule(
        tradingHoursUrl,
        requester,
        sessionBoundariesTimeZone,
        sessionMarket,
        sessionMarketType,
      ),
  )

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
    return data.data.result.map((d) => {
      const timeMs = new TZDate(d.time, sessionBoundariesTimeZone).getTime()
      const endTimeMs =
        d.endTime !== undefined
          ? new TZDate(d.endTime, sessionBoundariesTimeZone).getTime()
          : undefined
      // A malformed phase time parses to NaN and would silently corrupt gating
      // (NaN comparisons are always false). Reject the whole schedule — the
      // caller treats it like any other tradinghours failure and walks to the
      // hard-coded fallback.
      if (Number.isNaN(timeMs) || (endTimeMs !== undefined && Number.isNaN(endTimeMs))) {
        throw new AdapterError({
          statusCode: 502,
          message: `TradingHours EA returned a malformed market-session schedule entry (unparseable time): ${JSON.stringify(
            d,
          )}`,
        })
      }
      return {
        status: d.status as TwentyfourFiveMarketStatus,
        timeMs,
        ...(endTimeMs !== undefined ? { endTimeMs } : {}),
      }
    })
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `TradingHoursEA request failed: ${e.message} ${
        JSON.stringify(e?.errorResponse) || e.name
      }`
    }
    throw e
  }
}

// The smoother's view of the schedule: only the boundaries it reacts to. REGULAR is
// dropped (smoothing only changes behavior at thin-liquidity session boundaries) and
// Sunday OVERNIGHT is dropped (stale weekend data must not feed smoothing). Gating
// needs the unfiltered list — use getSessionTransitions for that.
export const processData = (transitions: SessionTransition[], timezone: string): number[] =>
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
