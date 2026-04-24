import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { Month, tzDate } from './utils'

const TZ = 'US/Central'
const weekend = `516-017:${TZ}` // Friday 16:00 - Sunday 17:00

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, Month.May, 25, 13, 30, TZ),
    end: tzDate(2026, Month.May, 25, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Jun, 19, 12, 0, TZ),
    end: tzDate(2026, Month.Jun, 21, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Jul, 3, 12, 0, TZ),
    end: tzDate(2026, Month.Jul, 5, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Sep, 7, 13, 30, TZ),
    end: tzDate(2026, Month.Sep, 7, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 26, 13, 30, TZ),
    end: tzDate(2026, Month.Nov, 26, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 27, 13, 45, TZ),
    end: tzDate(2026, Month.Nov, 29, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 24, 12, 45, TZ),
    end: tzDate(2026, Month.Dec, 27, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 24, 12, 45, TZ),
    end: tzDate(2026, Month.Dec, 27, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 31, 16, 0, TZ),
    end: tzDate(2027, Month.Jan, 3, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
]

// https://www.cmegroup.com/trading-hours.html
// Open 5PM Sun to 4PM Fri CT, with daily closures from 4PM to 5PM
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
    isWeekendNow(weekend) || (now.getHours() >= 16 && now.getHours() < 17)
      ? MarketStatus.CLOSED
      : MarketStatus.OPEN

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
