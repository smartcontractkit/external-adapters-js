// ICE Brent crude trading primarily follows UK daylight savings (BST) for its core hours,
// but it temporarily adjusts to conform to US daylight savings time during
// the transition periods in March and October.
// Because the US and UK start/end daylight savings on different dates,

import { MarketStatus } from '@chainlink/external-adapter-framework/adapter/market-status'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { Month, tzDate } from './utils'

// ICE often issues circulars outlining temporary trading hours to align with US markets.
const TZ = 'America/New_York'
const weekend = `518-018:${TZ}` // Friday 18:00 - Sunday 18:00

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, Month.May, 25, 13, 30, TZ),
    end: tzDate(2026, Month.May, 25, 20, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Jun, 19, 13, 30, TZ),
    end: tzDate(2026, Month.Jun, 21, 18, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Jul, 3, 13, 30, TZ),
    end: tzDate(2026, Month.Jul, 5, 18, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Sep, 7, 13, 30, TZ),
    end: tzDate(2026, Month.Sep, 7, 20, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 26, 13, 30, TZ),
    end: tzDate(2026, Month.Nov, 26, 20, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 27, 15, 0, TZ),
    end: tzDate(2026, Month.Nov, 28, 18, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 24, 14, 0, TZ),
    end: tzDate(2026, Month.Dec, 27, 18, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 31, 15, 0, TZ),
    end: tzDate(2027, Month.Jan, 3, 18, 0, TZ),
    status: MarketStatus.CLOSED,
  },
]

// Open 18:00 - 18:00 Sun-Fri, pause from 18:00 - 20:00 on Mon-Thu ET
export const getStatus = () => {
  const now = TZDate.tz(TZ)

  const holiday = HOLIDAY_SCHEDULE.find(
    (s) => now.getTime() >= s.start.getTime() && now.getTime() < s.end.getTime(),
  )
  if (holiday) {
    return {
      marketStatus: holiday.status,
      statusString: MarketStatus[holiday.status],
      providerIndicatedTimeUnixMs: now.getTime(),
    }
  }

  const status =
    isWeekendNow(weekend) || (now.getHours() >= 18 && now.getHours() < 20 && now.getDay() != 0)
      ? MarketStatus.CLOSED
      : MarketStatus.OPEN

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
