import { Validator } from '@chainlink/external-adapter'
import { Execute, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig, Config } from './config'
import { getTokenAllocations } from './tvl'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import { ethers } from 'ethers'

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const allocations = await getTokenAllocations(config.controllerAddress, provider)

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request) => execute(request, config || makeConfig())
}
