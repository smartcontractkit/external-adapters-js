import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig, DEFAULT_ENDPOINT } from './config'
import { balance } from './endpoint'

export type JobSpecRequest = {
  id: string
  data: Record<string, unknown>
}
type JobSpecResponse = { statusCode: number; data: Record<string, unknown> }

const inputParams = {
  endpoint: false,
}

// Export function to integrate with Chainlink node
export const execute = async (
  request: JobSpecRequest,
  config: Config,
): Promise<JobSpecResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  let fn
  switch (endpoint) {
    case balance.Name: {
      const validator = new Validator(request, balance.inputParams)
      if (validator.error) throw validator.error

      fn = balance.execute(config, request, validator.validated.data)
      break
    }
    default: {
      throw Error(`Endpoint ${endpoint} not supported.`)
    }
  }

  const result = await fn
  return {
    statusCode: 200,
    data: Requester.success(jobRunID, {
      data: { result },
      result,
      status: 200,
    }),
  }
}

// Export function to integrate with Chainlink node
export const executeWithDefaults = async (request: JobSpecRequest): Promise<JobSpecResponse> => {
  const config: Config = getConfig()
  return await execute(request, config)
}
