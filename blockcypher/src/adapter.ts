import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Execute, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { getConfig, DEFAULT_ENDPOINT } from './config'
import { balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const executeWithConfig: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let result
  switch (endpoint) {
    case balance.Name: {
      result = await balance.execute(config, request)
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

const makeExecute: ExecuteFactory = (config) => async (request) =>
  executeWithConfig(request, config)

export const execute: Execute = makeExecute(getConfig())
