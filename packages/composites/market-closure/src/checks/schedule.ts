import { AdapterInputError, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, InputParameters } from '@chainlink/ea-bootstrap'
import { MarketClosure, Schedule } from 'market-closure'

const inputParameters: InputParameters = {
  schedule: false,
}

export const isMarketClosed = async (input: AdapterRequest): Promise<boolean> => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id

  // NOTE: complex type that validator doesn't handle. Should have its own validation.
  const schedule = (validator.validated.data.schedule as unknown as Schedule) || {}
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
