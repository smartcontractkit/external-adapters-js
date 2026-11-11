import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TZDate } from '@date-fns/tz'
import { getSessionsFallback } from './fallbackSession'
import { getFallbackSessionTransitions, getGatingTimezone } from './fallbackSessionSchedule'
import { SessionTransition, getSessionTransitions, processData } from './tradingHoursSession'

const logger = makeLogger('Session')

// Seconds relative to the nearest session boundary (-ve before, +ve after), plus the
// schedule source the smoother should attribute it to.
export type SecondsFromTransition = {
  value: number
  source: 'TRADINGHOURS' | 'FALLBACK'
}

const secondsFromNearest = (sessionTimes: number[], nowMs: number): number =>
  sessionTimes.reduce((minDiff, sessionTime) => {
    const diff = (nowMs - sessionTime) / 1000
    return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
  }, Number.MAX_SAFE_INTEGER)

// One tradinghours market-session fetch per price request, shared by both schedule
// consumers:
// - transitions: the unfiltered tradinghours schedule for session-start (pre-open
//   warm-up) gating. undefined when the fetch fails — the caller walks to
//   fallbackTransitions.
// - fallbackTransitions: gating's hard-coded labeled schedule, present whenever the
//   market/type has an entry — regardless of whether the fetch succeeded (a fetched
//   schedule that lacks a transition for the selected session is unusable, so the
//   fallback must always be at hand). Gating deliberately never reads the per-feed
//   sessionBoundaries/sessionBoundariesTimeZone params (the smoother's fallback): the
//   timezone for the tradinghours fetch and the fallback comes from the schedule entry.
// - secondsFromTransition: the smoother's "seconds from the nearest session boundary"
//   signal, from the same fetch via the smoother's filtering (processData). Only
//   produced when the request carries the smoother's session params; on a fetch failure
//   this alone falls back to the local sessionBoundaries, matching historical smoother
//   behavior.
export const getSessionSchedule = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
): Promise<{
  transitions?: SessionTransition[]
  fallbackTransitions?: SessionTransition[]
  secondsFromTransition?: SecondsFromTransition
}> => {
  const nowMs = Date.now()

  const fallbackTransitions =
    sessionMarket && sessionMarketType
      ? getFallbackSessionTransitions(sessionMarket, sessionMarketType, nowMs)
      : undefined

  // The fetch needs market identity and a timezone. The timezone is gating's schedule
  // entry first (so gating works without the smoother's params), else the smoother's
  // sessionBoundariesTimeZone (existing smoother behavior for other markets).
  const fetchTimezone =
    sessionMarket && sessionMarketType
      ? getGatingTimezone(sessionMarket, sessionMarketType) ?? sessionBoundariesTimeZone
      : undefined
  if (!sessionMarket || !sessionMarketType || !fetchTimezone) {
    return { fallbackTransitions }
  }

  const now = new TZDate(nowMs, sessionBoundariesTimeZone ?? fetchTimezone)
  // The smoother's signal is only meaningful with its own params (it needs
  // sessionBoundariesTimeZone for its fallback and its consumers). Its computations
  // keep using sessionBoundariesTimeZone exactly as before; fetchTimezone only drives
  // the tradinghours request and response parsing.
  const smootherTz = sessionBoundariesTimeZone

  try {
    const transitions = await getSessionTransitions(
      tradingHoursUrl,
      requester,
      fetchTimezone,
      sessionMarket,
      sessionMarketType,
    )
    return {
      transitions,
      fallbackTransitions,
      secondsFromTransition: smootherTz
        ? {
            value: secondsFromNearest(processData(transitions, smootherTz), now.getTime()),
            source: 'TRADINGHOURS',
          }
        : undefined,
    }
  } catch (e) {
    logger.error(
      `TradingHoursEA request failed; session-start gating uses the hard-coded fallback schedule, smoother falls back to sessionBoundaries: ${e}`,
    )
    return {
      fallbackTransitions,
      secondsFromTransition: smootherTz
        ? {
            value: secondsFromNearest(
              getSessionsFallback(now, sessionBoundaries, smootherTz),
              now.getTime(),
            ),
            source: 'FALLBACK',
          }
        : undefined,
    }
  }
}
