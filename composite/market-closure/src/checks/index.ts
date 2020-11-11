import { scheduleExecute } from './schedule'
import { thExecute } from './tradinghours'
import { Schedule } from 'market-closure'

export type CheckExecute = (symbol: string, schedule: Schedule) => Promise<boolean>

export type ExternalCheck = (symbol: string) => Promise<boolean>
export type ScheduleCheck = (schedule: Schedule) => boolean

export type CheckOptions = { type?: Check }
export enum Check {
  Schedule = 'schedule',
  TradingHours = 'tradinghours',
}

const isCheck = (envVar?: string): envVar is Check => Object.values(Check).includes(envVar as any)

export const getCheck = (): Check | undefined => {
  const check = process.env.CHECK_TYPE
  return isCheck(check) ? (check as Check) : undefined
}

export const getCheckImpl = (options: CheckOptions): CheckExecute => {
  switch (options.type) {
    case Check.Schedule:
      return checkWithSchedule()
    case Check.TradingHours:
      return checkWithSchedule(thExecute)
    default:
      throw Error(`Unknown protocol adapter type: ${options.type}`)
  }
}

export const checkWithSchedule = (check?: ExternalCheck): CheckExecute => {
  if (!check) return async (symbol: string, schedule: Schedule) => scheduleExecute(schedule)

  return async (symbol: string, schedule: Schedule) => {
    try {
      return await check(symbol)
    } catch (e) {
      return scheduleExecute(schedule)
    }
  }
}
