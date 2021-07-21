import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { price, bc_info, balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case price.Name: {
      return await price.execute(request, context, config)
      break
    }
    case 'difficulty':
    case 'height': {
      return await bc_info.execute(request, context, config)
      break
    }
    case balance.Name: {
      return balance.makeExecute(config)(request, context)
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
