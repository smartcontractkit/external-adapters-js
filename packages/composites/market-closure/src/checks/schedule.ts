import { AdapterInputError, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, InputParameters } from '@chainlink/types'
import { MarketClosure, Schedule } from 'market-closure'

const inputParameters: InputParameters = {
  schedule: false,
}

export const isMarketClosed = async (input: AdapterRequest): Promise<boolean> => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.jobRunID

  const schedule = validator.validated.data.schedule || {}
  if (Object.keys(schedule).length === 0) return false // Empty schedule, just pass

  // If there is no timezone, the schedule is mis-configured
  if (!schedule.timezone || schedule.timezone.length === 0)
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: 'timezone missing in schedule',
    })

  const marketSchedule = new MarketClosure(schedule as Schedule)
  return marketSchedule.tradingHalted()
}
