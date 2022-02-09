import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig } from '../../config'
import { schedule } from './endpoint'
import { score } from './endpoint'

export const NAME = 'mlb'

const inputParams = {
  endpoint: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint

  switch (endpoint.toLowerCase()) {
    case schedule.NAME: {
      return await schedule.execute(request, context, config)
    }
    case score.NAME: {
      return await score.execute(request, context, config)
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
  return async (request, context) => execute(request, context, config || makeConfig())
}
