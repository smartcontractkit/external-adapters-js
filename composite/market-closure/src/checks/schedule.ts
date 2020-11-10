import { ScheduleCheck } from './index'
import { MarketClosure, Schedule } from 'market-closure'

export const scheduleExecute: ScheduleCheck = (schedule: Schedule): boolean => {
  if (Object.keys(schedule).length === 0) return false // Empty schedule, just pass

  // If there is no timezone, the schedule is mis-configured
  if (!schedule.timezone || schedule.timezone.length === 0)
    throw new Error('timezone missing in schedule')

  const marketSchedule = new MarketClosure(schedule)
  return marketSchedule.tradingHalted()
}
