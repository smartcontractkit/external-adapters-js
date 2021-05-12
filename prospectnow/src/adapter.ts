import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { territoryAnalyzer } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)

  const { validated, error } = validator

  if (error) throw error

  Requester.logConfig(config)

  const { id, data } = validated
  const { endpoint = DEFAULT_ENDPOINT } = data

  switch (endpoint.toLowerCase()) {
    case territoryAnalyzer.NAME: {
      return await territoryAnalyzer.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID: id,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
