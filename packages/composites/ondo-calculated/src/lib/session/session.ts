import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TZDate } from '@date-fns/tz'
import { getSessions as fallback } from './fallbackSession'
import { getSessions as tradingHours } from './tradingHoursSession'

const logger = makeLogger('Session')

// Seconds relative to session boundary (-ve before, +ve after)
export const calculateSecondsFromTransition = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone: string,
  sessionMarket?: string,
  sessionMarketType?: string,
) => {
  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)

  let sessions = fallback(now, sessionBoundaries, sessionBoundariesTimeZone)

  try {
    if (sessionMarket && sessionMarketType) {
      sessions = await tradingHours(
        tradingHoursUrl,
        requester,
        sessionBoundariesTimeZone,
        sessionMarket,
        sessionMarketType,
      )
    }
  } catch (e) {
    logger.error(`TradingHoursEA request failed, falling back to sessionBoundaries: ${e}`)
  }

  return sessions.reduce((minDiff, sessionTime) => {
    const diff = (now.getTime() - sessionTime) / 1000
    return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
  }, Number.MAX_SAFE_INTEGER)
}
