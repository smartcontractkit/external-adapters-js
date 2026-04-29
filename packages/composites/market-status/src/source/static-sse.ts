import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { HALF_HOUR, HOUR, Month, ONE_MINUTE } from './utils'

const TZ = 'Asia/Shanghai'
const weekend = `515-109:${TZ}` // Friday 15:00 - Monday 9:00

const HOLIDAY_SCHEDULE = [
  { month: Month.May, day: 1 },
  { month: Month.May, day: 2 },
  { month: Month.May, day: 3 },
  { month: Month.May, day: 4 },
  { month: Month.May, day: 5 },
  { month: Month.Jun, day: 19 },
  { month: Month.Sep, day: 25 },
  { month: Month.Oct, day: 1 },
  { month: Month.Oct, day: 2 },
  { month: Month.Oct, day: 3 },
  { month: Month.Oct, day: 4 },
  { month: Month.Oct, day: 5 },
  { month: Month.Oct, day: 6 },
  { month: Month.Oct, day: 7 },
]

// Open 09:30 - 11:30, 13:00 - 14:57 CST Mon-Fri
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
  } else if (minutes >= 9 * HOUR + HALF_HOUR && minutes < 11 * HOUR + HALF_HOUR) {
    status = MarketStatus.OPEN
  } else if (minutes >= 13 * HOUR && minutes < 15 * HOUR - ONE_MINUTE * 3) {
    status = MarketStatus.OPEN
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
