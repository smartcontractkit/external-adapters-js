import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { HALF_HOUR, HOUR, Month, tzDate } from './utils'

const TZ = 'Asia/Hong_Kong'
const weekend = `516-109:${TZ}` // Friday 16:00 - Monday 9:00

const HOLIDAY_SCHEDULE = [
  // National Day
  {
    start: tzDate(2026, Month.Oct, 1, 9, 0, TZ),
    end: tzDate(2026, Month.Oct, 1, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  // Day after Chung Yeung
  {
    start: tzDate(2026, Month.Oct, 19, 9, 0, TZ),
    end: tzDate(2026, Month.Oct, 19, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  // Eve of Christmas - half day, morning session only
  {
    start: tzDate(2026, Month.Dec, 24, 12, 0, TZ),
    end: tzDate(2026, Month.Dec, 24, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  // Christmas Day
  {
    start: tzDate(2026, Month.Dec, 25, 9, 0, TZ),
    end: tzDate(2026, Month.Dec, 25, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  // Eve of New Year - half day, morning session only
  {
    start: tzDate(2026, Month.Dec, 31, 12, 0, TZ),
    end: tzDate(2026, Month.Dec, 31, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
]

// Open 09:30 - 12:00, 13:00 - 16:00 HKT Mon-Fri
// (09:00 - 09:30 pre-opening auction, 12:00 - 13:00 lunch break and 16:00 - 16:10 closing auction are not
// continuous trading, so they are reported as CLOSED)
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

  let status = MarketStatus.CLOSED
  const minutes = now.getHours() * HOUR + now.getMinutes()

  if (isWeekendNow(weekend)) {
    status = MarketStatus.CLOSED
  } else if (minutes >= 9 * HOUR + HALF_HOUR && minutes < 12 * HOUR) {
    status = MarketStatus.OPEN
  } else if (minutes >= 13 * HOUR && minutes < 16 * HOUR) {
    status = MarketStatus.OPEN
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
