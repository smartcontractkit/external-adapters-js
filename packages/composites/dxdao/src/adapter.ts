import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, Config } from './config'
import { tvl } from './endpoint'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.jobRunID
  const allocations = await tvl.getTokenAllocations(request, config)
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...request.data, allocations } })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
