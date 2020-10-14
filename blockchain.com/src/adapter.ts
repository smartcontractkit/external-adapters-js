import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config, getConfig, logConfig, DEFAULT_ENDPOINT } from './config'
import { balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute = async (
  request: AdapterRequest,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let result
  switch (endpoint) {
    case balance.Name: {
      const validator = new Validator(request, balance.inputParams)
      if (validator.error) throw validator.error

      result = await balance.execute(config, request, validator.validated.data)
      break
    }
    default: {
      throw Error(`Endpoint ${endpoint} not supported.`)
    }
  }

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

// Export function to integrate with Chainlink node
export const executeWithDefaults = async (request: AdapterRequest): Promise<AdapterResponse> =>
  execute(request, getConfig())
