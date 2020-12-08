import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { getConfig, DEFAULT_ENDPOINT } from './config'
import { price, balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig = async (request, config) => {
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
    case balance.Name: {
      response = await balance.execute(config, request)
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

  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory = (config) => {
  return async (request) => execute(request, config || getConfig())
}
