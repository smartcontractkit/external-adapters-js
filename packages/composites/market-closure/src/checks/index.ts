import { isMarketClosedFactory as schedule } from './schedule'
import { isMarketClosedFactory as th } from './tradinghours'
import { AdapterRequest } from '@chainlink/types'

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
  switch (type) {
    case CheckProvider.Schedule:
      return schedule(input)
    case CheckProvider.TradingHours:
      return async () => {
        try {
          const isMarketClosed = th(input)
          return await isMarketClosed()
        } catch (e) {
          const isMarketClosed = schedule(input)
          return await isMarketClosed()
        }
      }
    default:
      throw Error(`Unknown protocol adapter type: ${type}`)
  }
}
