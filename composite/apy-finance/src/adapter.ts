import { Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import { util } from '@chainlink/ea-bootstrap'
import makeRegistry from './registry'

export const execute: Execute = async (input) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const addressRegistry = util.getRequiredEnv('ADDRESS_REGISTRY')

  const registry = await makeRegistry(addressRegistry, rpcUrl)
  const allocations = await registry.getAllocations()

  return await TokenAllocation.execute({
    data: { ...input.data, ...allocations },
  })
}

export default execute
