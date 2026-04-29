import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { FIVE_MINUTES, HALF_HOUR, HOUR, Month } from './utils'

const TZ = 'Asia/Tokyo'
const weekend = `516-109:${TZ}` // Friday 16:00 - Monday 9:00

const HOLIDAY_SCHEDULE = [
  { month: Month.Apr, day: 29 },
  { month: Month.May, day: 4 },
  { month: Month.May, day: 5 },
  { month: Month.May, day: 6 },
  { month: Month.Jul, day: 20 },
  { month: Month.Aug, day: 11 },
  { month: Month.Sep, day: 21 },
  { month: Month.Sep, day: 22 },
  { month: Month.Sep, day: 23 },
  { month: Month.Oct, day: 12 },
  { month: Month.Nov, day: 3 },
  { month: Month.Nov, day: 23 },
  { month: Month.Dec, day: 31 },
]

// Open 09:00 - 11:30, 12:30 - 15:25 JST Mon-Fri
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
  } else if (minutes >= 9 * HOUR && minutes < 11 * HOUR + HALF_HOUR) {
    status = MarketStatus.OPEN
  } else if (minutes >= 12 * HOUR + HALF_HOUR && minutes < 15 * HOUR + HALF_HOUR - FIVE_MINUTES) {
    status = MarketStatus.OPEN
  }

  return {
    marketStatus: status,
    statusString: MarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
