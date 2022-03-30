import { ExecuteWithConfig, ExecuteFactory, InputParameters } from '@chainlink/types'
import { Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, Config } from './config'
import { tvl } from './endpoint'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

const inputParameters: InputParameters = {
  pairContractAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.jobRunID
  const allocations = await tvl.getTokenAllocations(request, config)
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...request.data, allocations } }, context)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
