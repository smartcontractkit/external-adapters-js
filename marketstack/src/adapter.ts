import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { eod } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case eod.Name: {
      const [data, result] = await eod.execute(config, request)
      data.result = result
      return Requester.success(jobRunID, {
        data,
        result,
        status: 200,
      })
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

export const makeExecute: ExecuteFactory = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
