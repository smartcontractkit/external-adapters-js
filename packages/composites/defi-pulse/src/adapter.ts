import { Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, AdapterRequest, Execute, AdapterContext } from '@chainlink/types'
import { getAllocations } from './index-allocations'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { makeConfig, Config } from './config'

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
}

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  const allocations = await getAllocations(
    asset.adapter,
    asset.address,
    config.rpcUrl,
    config.network,
  )

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
