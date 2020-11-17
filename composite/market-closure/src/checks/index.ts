import { scheduleExecute } from './schedule'
import { thExecute } from './tradinghours'
import { Schedule } from 'market-closure'

// We check for something and get yes/no answer
export type Check = () => Promise<boolean>

export enum CheckProvider {
  Schedule = 'schedule',
  TradingHours = 'tradinghours',
}

const isCheck = (envVar?: string): envVar is Check => Object.values(Check).includes(envVar as any)

export const getCheck = (): Check | undefined => {
  const check = process.env.CHECK_TYPE
  return isCheck(check) ? (check as Check) : undefined
}

export const getCheckImpl = (type: CheckProvider, input: AdapterRequest): Check => {
  switch (options.type) {
    case Check.Schedule:
      // TODO: validate input, get schedule
      return async () => schedule.isMarketClosed(schedule)
    case Check.TradingHours:
       // TODO: validate input, get symbol
      return async () => {
        try {
           return await th.isMarketClosed(symbol)
         } catch (e) {
           const checkSchedule = getCheckImpl(CheckProvider.Schedule, input)
           return await checkSchedule()
         }
      }
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
