import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { addHours, format, parse, startOfDay } from 'date-fns'
import scheduleData from './data/nyse-245.json'
import { HALF_HOUR, HOUR, Month, tzDate } from './utils'

const TZ = 'America/New_York'

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, Month.Jan, 18, 20, 0, TZ),
    end: tzDate(2026, Month.Jan, 19, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Feb, 15, 20, 0, TZ),
    end: tzDate(2026, Month.Feb, 16, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Apr, 2, 20, 0, TZ),
    end: tzDate(2026, Month.Apr, 3, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.May, 24, 20, 0, TZ),
    end: tzDate(2026, Month.May, 25, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Jun, 18, 20, 0, TZ),
    end: tzDate(2026, Month.Jun, 19, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Jul, 2, 20, 0, TZ),
    end: tzDate(2026, Month.Jul, 3, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Sep, 6, 20, 0, TZ),
    end: tzDate(2026, Month.Sep, 7, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Nov, 25, 20, 0, TZ),
    end: tzDate(2026, Month.Nov, 26, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Nov, 27, 13, 0, TZ),
    end: tzDate(2026, Month.Nov, 27, 17, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: tzDate(2026, Month.Nov, 27, 17, 0, TZ),
    end: tzDate(2026, Month.Nov, 27, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Dec, 24, 13, 0, TZ),
    end: tzDate(2026, Month.Dec, 24, 17, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: tzDate(2026, Month.Dec, 24, 17, 0, TZ),
    end: tzDate(2026, Month.Dec, 25, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, Month.Dec, 31, 20, 0, TZ),
    end: tzDate(2027, Month.Jan, 1, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
]

export const getStatus = (weekend?: string) => {
  const oldStatus = getStatusOld(weekend)
  const newStatus = getStatusNew()
  if (oldStatus.marketStatus !== newStatus) {
    const now = TZDate.tz(TZ)
    throw new Error(
      `Market status mismatch on ${now.toString()} between old and new logic: old=${
        oldStatus.statusString
      }, new=${TwentyfourFiveMarketStatus[newStatus]}`,
    )
  }
  return oldStatus
}

const parseTime = (time: string, date: TZDate): TZDate => {
  if (time === '24:00:00') {
    const startOfDate = startOfDay(date)
    return addHours(startOfDate, 24)
  }
  return parse(time, 'HH:mm:ss', date)
}

const getStatusNew = () => {
  const timezone = scheduleData.timezone
  const now = TZDate.tz(timezone)
  const nowFormatted = format(now, 'yyyy-MM-dd HH:mm:ss')

  for (const e of scheduleData.exceptions) {
    if (e.start <= nowFormatted && nowFormatted < e.end) {
      return TwentyfourFiveMarketStatus[e.status as keyof typeof TwentyfourFiveMarketStatus]
    }
  }

  const dayOfWeek = format(now, 'EEEE').toUpperCase()
  for (const weekly of scheduleData.weekly) {
    for (const when of weekly.when) {
      if (!when.days.includes(dayOfWeek)) {
        continue
      }
      for (const times of when.times) {
        const startTime = parseTime(times.start, now)
        const endTime = parseTime(times.end, now)
        if (startTime <= now && now < endTime) {
          return TwentyfourFiveMarketStatus[
            weekly.status as keyof typeof TwentyfourFiveMarketStatus
          ]
        }
      }
    }
  }

  throw new Error(`No market status found for current time: ${nowFormatted}`)
}

const getStatusOld = (weekend?: string) => {
  const now = TZDate.tz(TZ)

  const holiday = HOLIDAY_SCHEDULE.find(
    (s) => now.getTime() >= s.start.getTime() && now.getTime() < s.end.getTime(),
  )
  if (holiday) {
    return {
      marketStatus: holiday.status,
      statusString: TwentyfourFiveMarketStatus[holiday.status],
      providerIndicatedTimeUnixMs: now.getTime(),
    }
  }

  let status = TwentyfourFiveMarketStatus.OVERNIGHT
  const minutes = now.getHours() * HOUR + now.getMinutes()
  if (isWeekendNow(weekend)) {
    status = TwentyfourFiveMarketStatus.WEEKEND
  } else if (minutes >= 4 * HOUR && minutes < 9 * HOUR + HALF_HOUR) {
    status = TwentyfourFiveMarketStatus.PRE_MARKET
  } else if (minutes >= 9 * HOUR + HALF_HOUR && minutes < 16 * HOUR) {
    status = TwentyfourFiveMarketStatus.REGULAR
  } else if (minutes >= 16 * HOUR && minutes < 20 * HOUR) {
    status = TwentyfourFiveMarketStatus.POST_MARKET
  }

  return {
    marketStatus: status,
    statusString: TwentyfourFiveMarketStatus[status],
    providerIndicatedTimeUnixMs: now.getTime(),
  }
}
