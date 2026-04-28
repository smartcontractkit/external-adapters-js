import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
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
