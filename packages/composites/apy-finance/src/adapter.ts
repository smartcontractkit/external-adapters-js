import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import makeRegistry from './registry'
import { makeConfig, Config } from './config'

const customParams = {
  source: true,
  quote: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const registry = await makeRegistry(config.registryAddr, config.rpcUrl)
  const allocations = await registry.getAllocations()

  const response = await Requester.request({
    ...config.taConfig,
    data: {
      id: jobRunID,
      data: { ...validator.validated.data, allocations },
    },
  })
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
