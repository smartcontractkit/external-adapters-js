import * as schedule from './schedule'
import * as th from './tradinghours'
import { AdapterRequest } from '@chainlink/types'
import { Validator } from '@chainlink/external-adapter'

// We check for something and get yes/no answer
export type Check = () => Promise<boolean>

export enum CheckProvider {
  Schedule = 'schedule',
  TradingHours = 'tradinghours',
}

const isCheckProvider = (envVar?: string): envVar is CheckProvider =>
  Object.values(CheckProvider).includes(envVar as any)

export const getCheckProvider = (): CheckProvider | undefined => {
  const check = process.env.CHECK_TYPE
  return isCheckProvider(check) ? (check as CheckProvider) : undefined
}

export const getCheckImpl = (type: CheckProvider | undefined, input: AdapterRequest): Check => {
  let validator: { error: any; validated: { input: { schedule: any; symbol: string } } }
  switch (type) {
    case CheckProvider.Schedule:
      validator = new Validator(input, schedule.customParams)
      if (validator.error) throw validator.error
      return async () => schedule.isMarketClosed(validator.validated.input.schedule || {})
    case CheckProvider.TradingHours:
      validator = new Validator(input, schedule.customParams)
      if (validator.error) throw validator.error
      return async () => {
        try {
          return await th.isMarketClosed(validator.validated.input.symbol)
        } catch (e) {
          const checkSchedule = getCheckImpl(CheckProvider.Schedule, input)
          return await checkSchedule()
        }
      }
    default:
      throw Error(`Unknown protocol adapter type: ${type}`)
  }
}
