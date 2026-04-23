import { TZDate } from '@date-fns/tz'

export const HOUR = 60
export const HALF_HOUR = 30

export const tzDate = (
  year: number,
  month: number,
  date: number,
  hours: number,
  minutes: number,
  timeZone: string,
) => new TZDate(year, month - 1, date, hours, minutes, timeZone)
