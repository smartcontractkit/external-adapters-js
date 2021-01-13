import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { price, stats, balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let response
  switch (endpoint) {
    case price.Name: {
      response = await price.execute(config, request)
      break
    }
    case 'difficulty':
    case 'height': {
      response = await stats.execute(config, request)
      break
    }
    case balance.Name: {
      return balance.makeExecute(config)(request)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }

  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
