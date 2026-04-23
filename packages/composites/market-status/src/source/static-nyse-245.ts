import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'
import { HALF_HOUR, HOUR, tzDate } from './utils'

const TZ = 'America/New_York'

const HOLIDAY_SCHEDULE = [
  {
    start: tzDate(2026, 1, 18, 20, 0, TZ),
    end: tzDate(2026, 1, 19, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 2, 15, 20, 0, TZ),
    end: tzDate(2026, 2, 16, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 4, 2, 20, 0, TZ),
    end: tzDate(2026, 4, 3, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 5, 24, 20, 0, TZ),
    end: tzDate(2026, 5, 25, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 6, 18, 20, 0, TZ),
    end: tzDate(2026, 6, 19, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 7, 2, 20, 0, TZ),
    end: tzDate(2026, 7, 3, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 9, 6, 20, 0, TZ),
    end: tzDate(2026, 9, 7, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 11, 25, 20, 0, TZ),
    end: tzDate(2026, 11, 26, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 11, 27, 13, 0, TZ),
    end: tzDate(2026, 11, 27, 17, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: tzDate(2026, 11, 27, 17, 0, TZ),
    end: tzDate(2026, 11, 27, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 12, 24, 13, 0, TZ),
    end: tzDate(2026, 12, 24, 17, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: tzDate(2026, 12, 24, 17, 0, TZ),
    end: tzDate(2026, 12, 25, 20, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: tzDate(2026, 12, 31, 20, 0, TZ),
    end: tzDate(2027, 1, 1, 20, 0, TZ),
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
