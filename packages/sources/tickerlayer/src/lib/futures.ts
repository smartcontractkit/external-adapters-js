import { tz } from '@date-fns/tz'
import { isValid, parseISO, startOfDay } from 'date-fns'
import type { WSResponse } from '../transport/stock_quotes'
import { toNumber } from '../transport/util'

export const extractFutureFields = (
  message: WSResponse,
  calculatedMid: number,
  config: { ROLL_DATE_TIMEZONE: string; ROLL_DATE_TIME_SECONDS: number },
) => {
  const mid_price = toNumber(message.price) || calculatedMid

  // e.g. 2026-11-20
  const expiry_date = dateToSeconds(message.last_trade_date, config.ROLL_DATE_TIMEZONE)
  if (isNaN(expiry_date)) {
    return {}
  }

  // e.g. 2026-11-20
  const roll_date = dateToSeconds(
    message.roll_date,
    config.ROLL_DATE_TIMEZONE,
    config.ROLL_DATE_TIME_SECONDS,
  )
  if (isNaN(roll_date)) {
    return {}
  }

  // e.g. 2026-12
  const contract_month = toNumber(message.contract_month?.split('-')[1])
  if (contract_month === undefined || contract_month < 1 || contract_month > 12) {
    return {}
  }

  const trading_day_of_month = toNumber(message.trading_day_of_month)
  if (
    trading_day_of_month === undefined ||
    trading_day_of_month < 1 ||
    trading_day_of_month > (toNumber(message.trading_days_in_month) || 0)
  ) {
    return {}
  }

  let price_goldman_roll: number | undefined = mid_price
  let price_goldman_continuous_roll: number | undefined = mid_price
  // C1,C2,C3 use price from rolls
  if (/\.C[1-3]$/.test(message.symbol)) {
    price_goldman_roll = toNumber(message.rolls?.r5?.price)
    price_goldman_continuous_roll = toNumber(message.rolls?.r5c?.price)
    if (price_goldman_roll === undefined || price_goldman_continuous_roll === undefined) {
      return {}
    }
  }

  return {
    mid_price,
    contract_month,
    expiry_date,
    roll_date,
    trading_day_of_month,
    price_goldman_roll,
    price_goldman_continuous_roll,
  }
}

const dateToSeconds = (dateString = '', timezone: string, offset = 0) => {
  const date = parseISO(dateString, { in: tz(timezone) })
  if (!isValid(date)) {
    return NaN
  }
  return startOfDay(date).getTime() / 1000 + offset
}
