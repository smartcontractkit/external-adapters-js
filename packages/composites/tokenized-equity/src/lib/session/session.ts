import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TZDate } from '@date-fns/tz'
import { getSessionsFallback } from './fallbackSession'
import {
  SessionTransition,
  getSessionTransitions,
  getSessions as tradingHours,
} from './tradingHoursSession'

const logger = makeLogger('Session')

// Seconds relative to session boundary (-ve before, +ve after)
export const calculateSecondsFromTransition = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
) => {
  if (!sessionBoundariesTimeZone || !sessionMarket || !sessionMarketType) {
    return
  }

  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)

  let sessions: number[]
  let sessionSource: 'TRADINGHOURS' | 'FALLBACK'

  try {
    sessions = await tradingHours(
      tradingHoursUrl,
      requester,
      sessionBoundariesTimeZone,
      sessionMarket,
      sessionMarketType,
    )
    sessionSource = 'TRADINGHOURS'
  } catch (e) {
    sessions = getSessionsFallback(now, sessionBoundaries, sessionBoundariesTimeZone)
    sessionSource = 'FALLBACK'
    logger.error(`TradingHoursEA request failed, falling back to sessionBoundaries: ${e}`)
  }

  return {
    value: sessions.reduce((minDiff, sessionTime) => {
      const diff = (now.getTime() - sessionTime) / 1000
      return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
    }, Number.MAX_SAFE_INTEGER),
    source: sessionSource,
  }
}

// Full session transition schedule for session-start (pre-open warm-up) gating.
// Returns undefined when the schedule cannot be determined — the caller decides
// whether that is acceptable (gating disabled) or a rejection (gating fails closed).
// The local sessionBoundaries fallback is deliberately not used here: its times are
// unlabeled, so it cannot say which session a boundary opens (notably it lacks the
// regular open), and guessing would reject or admit the wrong reports.
export const getSessionStartTransitions = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
): Promise<SessionTransition[] | undefined> => {
  if (!sessionBoundariesTimeZone || !sessionMarket || !sessionMarketType) {
    return undefined
  }
  try {
    return await getSessionTransitions(
      tradingHoursUrl,
      requester,
      sessionBoundariesTimeZone,
      sessionMarket,
      sessionMarketType,
    )
  } catch (e) {
    logger.error(`TradingHoursEA session schedule unavailable for session-start gating: ${e}`)
    return undefined
  }
}
