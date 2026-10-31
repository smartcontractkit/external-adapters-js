import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TZDate } from '@date-fns/tz'
import { getFallbackSessionEvents } from './fallbackSession'
import { getMarketStatus, getSessions as tradingHours } from './tradingHoursSession'
import type { SessionContext, SessionEvent } from './types'

const logger = makeLogger('Session')

/**
 * Builds the session context used by both the smoother and the session gate.
 *
 * - `events` is the full schedule (including REGULAR and Sunday overnight).
 * - `secondsFromTransition` keeps the existing smoothing semantics: only
 *   PRE_MARKET/POST_MARKET/OVERNIGHT starts count, and Sunday overnight and
 *   REGULAR are excluded.
 * - `expectedStatus` comes from the tradinghours market-status endpoint so the
 *   gate can reject reports for a session that is not actually open, including
 *   the weekly closure.
 */
export const getSessionContext = async (
  tradingHoursUrl: string,
  requester: Requester,
  sessionBoundaries: string[],
  sessionBoundariesTimeZone?: string,
  sessionMarket?: string,
  sessionMarketType?: string,
  sessionWeekend?: string,
): Promise<SessionContext | undefined> => {
  if (!sessionBoundariesTimeZone || !sessionMarket || !sessionMarketType) {
    return
  }

  const now = new TZDate(new Date().getTime(), sessionBoundariesTimeZone)
  const weekend = sessionWeekend ?? `520-020:${sessionBoundariesTimeZone}`

  const [eventsResult, statusResult] = await Promise.allSettled([
    tradingHours(
      tradingHoursUrl,
      requester,
      sessionBoundariesTimeZone,
      sessionMarket,
      sessionMarketType,
    ),
    // The 24/5 market-status endpoint maps the provider status to
    // PRE_MARKET/REGULAR/POST_MARKET/OVERNIGHT/WEEKEND. Other market types use a
    // different enum, so the schedule's latest event is used instead.
    sessionMarketType === '24/5'
      ? getMarketStatus(tradingHoursUrl, requester, sessionMarket, sessionMarketType, weekend)
      : Promise.resolve(undefined),
  ])

  if (eventsResult.status === 'rejected') {
    const events = getFallbackSessionEvents(now, sessionBoundaries, sessionBoundariesTimeZone)
    logger.error(
      `TradingHoursEA request failed, falling back to sessionBoundaries: ${eventsResult.reason}`,
    )
    if (events.length === 0) {
      logger.warn('Session schedule is empty; the session gate is disabled until it is available')
    }
    return {
      secondsFromTransition: calculateSecondsFromTransition(
        now.getTime(),
        events,
        sessionBoundariesTimeZone,
      ),
      source: 'FALLBACK',
      events,
      expectedStatus: undefined,
      weekend,
    }
  }

  const events = eventsResult.value
  let expectedStatus: TwentyfourFiveMarketStatus | undefined
  if (statusResult.status === 'fulfilled' && statusResult.value !== undefined) {
    expectedStatus = statusResult.value
  } else {
    expectedStatus = latestEventAtOrBefore(events, now.getTime())?.status
    if (statusResult.status === 'rejected') {
      logger.warn(
        `TradingHoursEA market-status request failed, using the scheduled session instead: ${statusResult.reason}`,
      )
    }
  }

  return {
    secondsFromTransition: calculateSecondsFromTransition(
      now.getTime(),
      events,
      sessionBoundariesTimeZone,
    ),
    source: 'TRADINGHOURS',
    events,
    expectedStatus,
    weekend,
  }
}

const calculateSecondsFromTransition = (
  nowMs: number,
  events: SessionEvent[],
  timeZone: string,
): number => {
  const smoothingEvents = events.filter((event) => isSmoothingEvent(event, timeZone))

  return smoothingEvents.reduce((minDiff, event) => {
    const diff = (nowMs - event.startMs) / 1000
    return Math.abs(diff) < Math.abs(minDiff) ? diff : minDiff
  }, Number.MAX_SAFE_INTEGER)
}

const isSmoothingEvent = (event: SessionEvent, timeZone: string): boolean => {
  const date = new TZDate(event.startMs, timeZone)

  if (event.status === TwentyfourFiveMarketStatus.UNKNOWN) {
    // Fallback boundaries have no status. Preserve the existing behavior of
    // skipping Sunday 20:00 so weekend data is not used to smooth.
    return !(date.getDay() === 0 && date.getHours() === 20 && date.getMinutes() === 0)
  }

  if (
    event.status !== TwentyfourFiveMarketStatus.PRE_MARKET &&
    event.status !== TwentyfourFiveMarketStatus.POST_MARKET &&
    event.status !== TwentyfourFiveMarketStatus.OVERNIGHT
  ) {
    return false
  }

  // Skip Sunday overnight because we don't want to use stale weekend data to smooth.
  return !(event.status === TwentyfourFiveMarketStatus.OVERNIGHT && date.getDay() === 0)
}

export const latestEventAtOrBefore = (
  events: SessionEvent[],
  nowMs: number,
): SessionEvent | undefined =>
  events.reduce<SessionEvent | undefined>((latest, event) => {
    if (event.startMs > nowMs) {
      return latest
    }
    if (!latest || event.startMs > latest.startMs) {
      return event
    }
    return latest
  }, undefined)
