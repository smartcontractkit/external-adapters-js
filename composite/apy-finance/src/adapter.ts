import { Validator } from '@chainlink/external-adapter'
import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import makeRegistry from './registry'
import { makeConfig, Config } from './config'

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const registry = await makeRegistry(config.addressRegistry, config.rpcUrl)
  const allocations = await registry.getAllocations()

  const tokenAllocationExecute = TokenAllocation.makeExecute()

  return await tokenAllocationExecute({
    data: { ...input.data, ...allocations },
  })
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input) => {
  return execute(input, config || makeConfig())
}
