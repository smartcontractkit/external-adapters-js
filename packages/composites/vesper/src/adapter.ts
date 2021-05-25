import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Config, makeConfig } from './config'
import { ethers } from 'ethers'
import { getTokenAllocations } from './tvl'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

const customParams = {
  controller: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const controller = validator.validated.data.controller
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const allocations = await getTokenAllocations(controller, provider)

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
