import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute, ExecuteWithDefaults } from '@chainlink/types'
import { Config, getConfig, logConfig, DEFAULT_ENDPOINT } from './config'
import { balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute: Execute = async (request, config: Config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let response
  switch (endpoint) {
    case balance.Name: {
      response = await balance.execute(config, request)
      break
    }
    default: {
      throw Error(`Endpoint ${endpoint} not supported.`)
    }
  }

  return Requester.success(jobRunID, response)
}

// Export function to integrate with Chainlink node
export const executeWithDefaults: ExecuteWithDefaults = async (request) =>
  execute(request, getConfig())
