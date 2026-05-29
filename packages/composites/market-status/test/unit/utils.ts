import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { TZDate } from '@date-fns/tz'
import { getStatusFromStaticSchedule, StaticSourceName } from '../../src/source/static'

const ONE_MINUTE = 60_000

export const expectOpensAt = (source: StaticSourceName, openTime: TZDate) => {
  jest.setSystemTime(openTime.getTime() - ONE_MINUTE)
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.CLOSED)
  jest.setSystemTime(openTime.getTime())
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.OPEN)
  jest.setSystemTime(openTime.getTime() + ONE_MINUTE)
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.OPEN)
}

export const expectClosesAt = (source: StaticSourceName, closeTime: TZDate) => {
  jest.setSystemTime(closeTime.getTime() - ONE_MINUTE)
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.OPEN)
  jest.setSystemTime(closeTime.getTime())
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.CLOSED)
  jest.setSystemTime(closeTime.getTime() + ONE_MINUTE)
  expect(getStatusFromStaticSchedule(source).marketStatus).toEqual(MarketStatus.CLOSED)
}
