import { TZDate } from '@date-fns/tz'

export enum Month {
  Jan = 0,
  Feb = 1,
  Mar = 2,
  Apr = 3,
  May = 4,
  Jun = 5,
  Jul = 6,
  Aug = 7,
  Sep = 8,
  Oct = 9,
  Nov = 10,
  Dec = 11,
}

export const HOUR = 60
export const HALF_HOUR = 30
export const FIVE_MINUTES = 5
export const ONE_MINUTE = 1

export const tzDate = (
  year: number,
  month: Month,
  date: number,
  hours: number,
  minutes: number,
  timeZone: string,
) => new TZDate(year, month, date, hours, minutes, timeZone)
