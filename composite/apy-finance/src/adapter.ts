import { Validator } from '@chainlink/external-adapter'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import makeRegistry from './registry'
import { makeConfig, Config } from './config'

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const registry = await makeRegistry(config.addressRegistry, config.rpcUrl)
  const allocations = await registry.getAllocations()

  const tokenAllocationExecute = TokenAllocation.makeExecute()

  return await tokenAllocationExecute({
    data: { ...input.data, ...allocations },
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
