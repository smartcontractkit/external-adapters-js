import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { tzDate } from './utils'

const TZ = 'US/Central'
const weekend = `516-017:${TZ}` // Friday 16:00 - Sunday 17:00

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, 5, 25, 13, 30, TZ),
    end: tzDate(2026, 5, 25, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 6, 19, 12, 0, TZ),
    end: tzDate(2026, 6, 21, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 7, 3, 12, 0, TZ),
    end: tzDate(2026, 7, 5, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 9, 7, 13, 30, TZ),
    end: tzDate(2026, 9, 7, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 11, 26, 13, 30, TZ),
    end: tzDate(2026, 11, 26, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 11, 27, 13, 45, TZ),
    end: tzDate(2026, 11, 29, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 12, 24, 12, 45, TZ),
    end: tzDate(2026, 12, 27, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 12, 24, 12, 45, TZ),
    end: tzDate(2026, 12, 27, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
  {
    start: tzDate(2026, 12, 31, 16, 0, TZ),
    end: tzDate(2027, 1, 3, 17, 0, TZ),
    status: MarketStatus.CLOSED,
  },
]

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

  let status = MarketStatus.OPEN
  if (isWeekendNow(weekend)) {
    status = MarketStatus.CLOSED
  } else if (now.getHours() >= 16 && now.getHours() <= 17) {
    status = MarketStatus.CLOSED
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
