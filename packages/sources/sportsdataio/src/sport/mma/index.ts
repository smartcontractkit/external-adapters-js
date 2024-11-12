import { AdapterInputError, InputParameters, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { makeConfig } from '../../config'
import { schedule, event, fight, leagues } from './endpoint'

export const NAME = 'mma'

export type TInputParameters = Record<string, never>
export const inputParams: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || ''

  switch (endpoint.toLowerCase()) {
    case schedule.NAME: {
      return await schedule.execute(request, context, config)
    }
    case event.NAME: {
      return await event.execute(request, context, config)
    }
    case fight.NAME: {
      return await fight.execute(request, context, config)
    }
    case leagues.NAME: {
      return await leagues.execute(request, context, config)
    }
    default: {
      throw new AdapterInputError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
