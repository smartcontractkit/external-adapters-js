import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { FIVE_MINUTES, HALF_HOUR, HOUR, Month, tzDate } from './utils'

const TZ = 'Asia/Seoul'
const weekend = `516-109:${TZ}` // Friday 16:00 - Monday 9:00

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, Month.May, 1, 9, 0, TZ),
    end: tzDate(2026, Month.May, 1, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.May, 5, 9, 0, TZ),
    end: tzDate(2026, Month.May, 5, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.May, 25, 9, 0, TZ),
    end: tzDate(2026, Month.May, 25, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Aug, 17, 9, 0, TZ),
    end: tzDate(2026, Month.Aug, 17, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Sep, 24, 9, 0, TZ),
    end: tzDate(2026, Month.Sep, 24, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Sep, 25, 9, 0, TZ),
    end: tzDate(2026, Month.Sep, 25, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Oct, 5, 9, 0, TZ),
    end: tzDate(2026, Month.Oct, 5, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 19, 9, 0, TZ),
    end: tzDate(2026, Month.Nov, 19, 10, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Nov, 19, 15, 20, TZ),
    end: tzDate(2026, Month.Nov, 19, 16, 20, TZ),
    status: MarketStatus.OPEN,
  },
  {
    start: tzDate(2026, Month.Dec, 25, 9, 0, TZ),
    end: tzDate(2026, Month.Dec, 25, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, Month.Dec, 31, 9, 0, TZ),
    end: tzDate(2026, Month.Dec, 31, 16, 0, TZ),
    status: MarketStatus.CLOSED,
  },
]

// Open 09:00 - 15:20 KST Mon-Fri
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
  } else if (minutes >= 9 * HOUR && minutes < 15 * HOUR + HALF_HOUR - FIVE_MINUTES * 2) {
    status = MarketStatus.OPEN
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
