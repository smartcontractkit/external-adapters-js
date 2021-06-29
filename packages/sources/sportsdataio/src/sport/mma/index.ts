import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig } from '../../config'
import { schedule, event, fight, leagues } from './endpoint'

export const NAME = 'mma'

const inputParams = {
  endpoint: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint

  switch (endpoint.toLowerCase()) {
    case schedule.NAME: {
      return await schedule.execute(request, config)
    }
    case event.NAME: {
      return await event.execute(request, config)
    }
    case fight.NAME: {
      return await fight.execute(request, config)
    }
    case leagues.NAME: {
      return await leagues.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
