import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { price, dominance, marketcap } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let result
  switch (endpoint) {
    case price.Name: {
      result = await price.execute(config, request)
      break
    }
    case dominance.Name: {
      result = await dominance.execute(config, request)
      break
    }
    case marketcap.Name: {
      result = await marketcap.execute(config, request)
      break
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
