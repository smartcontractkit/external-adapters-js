import { Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import { util } from '@chainlink/ea-bootstrap'
import makeRegistry from './registry'

const customParams = {
  currency: false,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const addressRegistry = util.getRequiredEnv('ADDRESS_REGISTRY')

  const registry = await makeRegistry(addressRegistry, rpcUrl)
  const allocations = await registry.getAllocations()

  return await TokenAllocation.execute({
    ...input,
    data: { ...allocations, currency: validator.validated.data.currency },
  })
}

export default execute
