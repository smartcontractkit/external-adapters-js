import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_SPORT } from './config'
import { MMA, NFL, NCAA_FB } from './sport'

const inputParams = {
  sport: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const sport = validator.validated.data.sport || DEFAULT_SPORT

  switch (sport.toLowerCase()) {
    case MMA.NAME: {
      return await MMA.execute(request, config)
    }
    case NFL.NAME: {
      return await NFL.execute(request, config)
    }
    case NCAA_FB.NAME: {
      return await NCAA_FB.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Sport ${sport} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
