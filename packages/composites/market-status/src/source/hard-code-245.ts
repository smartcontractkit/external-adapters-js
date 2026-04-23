import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { isWeekendNow } from '@chainlink/external-adapter-framework/validation/market-status'
import { TZDate } from '@date-fns/tz'

const HOUR = 60
const HALF_HOUR = 30
const TZ = 'America/New_York'

const HOLIDAY_SCHEDULE = [
  {
    start: new TZDate(2026, 0, 18, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 0, 19, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 1, 15, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 1, 16, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 3, 2, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 3, 3, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 4, 24, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 4, 25, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 5, 18, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 5, 19, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 6, 2, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 6, 3, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 8, 6, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 8, 7, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 10, 25, 20, 0, 0, 0, TZ),
    end: new TZDate(2026, 10, 26, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 10, 27, 13, 0, 0, 0, TZ),
    end: new TZDate(2026, 10, 27, 17, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: new TZDate(2026, 10, 27, 17, 0, 0, 0, TZ),
    end: new TZDate(2026, 10, 27, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 11, 24, 13, 0, 0, 0, TZ),
    end: new TZDate(2026, 11, 24, 17, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.POST_MARKET,
  },
  {
    start: new TZDate(2026, 11, 24, 17, 0, 0, 0, TZ),
    end: new TZDate(2026, 11, 25, 20, 0, 0, 0, TZ),
    status: TwentyfourFiveMarketStatus.WEEKEND,
  },
  {
    start: new TZDate(2026, 11, 31, 20, 0, 0, 0, TZ),
    end: new TZDate(2027, 0, 1, 20, 0, 0, 0, TZ),
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
