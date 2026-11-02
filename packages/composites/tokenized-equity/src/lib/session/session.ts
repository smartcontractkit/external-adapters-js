import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TZDate } from '@date-fns/tz'
import { getSessionsFallback } from './fallbackSession'
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
// - transitions: the unfiltered schedule for session-start (pre-open warm-up) gating.
//   undefined when the schedule cannot be determined — the caller decides whether that
//   is acceptable (gating disabled) or a rejection (gating fails closed). The local
//   sessionBoundaries fallback is deliberately not used here: its times are unlabeled,
//   so it cannot say which session a boundary opens (notably it lacks the regular
//   open), and guessing would reject or admit the wrong reports.
// - secondsFromTransition: the smoother's "seconds from the nearest session boundary"
//   signal, derived from the same fetch via the smoother's filtering (processData).
//   On a fetch failure this alone falls back to the local sessionBoundaries, matching
//   historical smoother behavior.
export const getSessionSchedule = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
): Promise<{
  transitions?: SessionTransition[]
  secondsFromTransition?: SecondsFromTransition
}> => {
  if (!sessionBoundariesTimeZone || !sessionMarket || !sessionMarketType) {
    return {}
  }

  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)

  try {
    const transitions = await getSessionTransitions(
      tradingHoursUrl,
      requester,
      sessionBoundariesTimeZone,
      sessionMarket,
      sessionMarketType,
    )
    return {
      transitions,
      secondsFromTransition: {
        value: secondsFromNearest(
          processData(transitions, sessionBoundariesTimeZone),
          now.getTime(),
        ),
        source: 'TRADINGHOURS',
      },
    }
  } catch (e) {
    logger.error(
      `TradingHoursEA request failed; session-start gating has no schedule, smoother falls back to sessionBoundaries: ${e}`,
    )
    return {
      secondsFromTransition: {
        value: secondsFromNearest(
          getSessionsFallback(now, sessionBoundaries, sessionBoundariesTimeZone),
          now.getTime(),
        ),
        source: 'FALLBACK',
      },
    }
  }
}

// Seconds relative to session boundary (-ve before, +ve after)
export const calculateSecondsFromTransition = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
): Promise<SecondsFromTransition | undefined> =>
  (
    await getSessionSchedule(
      tradingHoursUrl,
      requester,
      sessionBoundaries,
      sessionBoundariesTimeZone,
      sessionMarket,
      sessionMarketType,
    )
  ).secondsFromTransition
