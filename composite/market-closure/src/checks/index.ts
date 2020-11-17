import { isMarketClosed as schedule } from './schedule'
import { isMarketClosed as th } from './tradinghours'
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
      return async () => schedule(input)
    case CheckProvider.TradingHours:
      return async () => {
        try {
          return await th(input)
        } catch (e) {
          return schedule(input)
        }
      }
    default:
      throw Error(`Unknown protocol adapter type: ${type}`)
  }
}
