import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { FIVE_MINUTES, HALF_HOUR, HOUR, Month } from './utils'

const TZ = 'Asia/Taipei'
const weekend = `514-109:${TZ}` // Friday 14:00 - Monday 9:00

const HOLIDAY_SCHEDULE = [
  { month: Month.May, day: 1 },
  { month: Month.Jun, day: 19 },
  { month: Month.Sep, day: 25 },
  { month: Month.Sep, day: 28 },
  { month: Month.Oct, day: 9 },
  { month: Month.Oct, day: 26 },
  { month: Month.Dec, day: 25 },
]

// Open 09:00 - 13:25 CST Mon-Fri
export const getStatus = () => {
  const now = TZDate.tz(TZ)

  const holiday = HOLIDAY_SCHEDULE.find(
    (s) => now.getMonth() === s.month && now.getDate() === s.day,
  )
  if (holiday) {
    return {
      marketStatus: MarketStatus.CLOSED,
      statusString: MarketStatus[MarketStatus.CLOSED],
      providerIndicatedTimeUnixMs: now.getTime(),
    }
  }

  let status = MarketStatus.CLOSED
  const minutes = now.getHours() * HOUR + now.getMinutes()

  if (isWeekendNow(weekend)) {
    status = MarketStatus.CLOSED
  } else if (minutes >= 9 * HOUR && minutes < 13 * HOUR + HALF_HOUR - FIVE_MINUTES) {
    status = MarketStatus.OPEN
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
