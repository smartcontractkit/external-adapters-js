import { Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import makeRegistry from './registry'
import { makeConfig, Config } from './config'

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const registry = await makeRegistry(config.registryAddr, config.rpcUrl)
  const allocations = await registry.getAllocations()

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: validator.validated.id, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
