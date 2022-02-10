import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Execute, ExecuteWithConfig, InputParameters, Config } from '@chainlink/types'
import { makeConfig, XBCI, XLCI } from './config'
import { deriveAllocations } from './tokenAllocationDeriver'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const inputParameters: InputParameters = {
  index: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.jobRunID
  const index = validator.validated.data.index.toLowerCase()
  const path = getURLPath(jobRunID, index)
  const allocations = await deriveAllocations(config, path)
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const getURLPath = (jobRunID: string, index: string): string => {
  switch (index.toLowerCase()) {
    case XBCI:
      return '/v1/index/xangle-bluechip '
    case XLCI:
      return '/v1/index/xangle-largecap '
    default:
      throw new AdapterError({
        jobRunID,
        message: `${index} not supported. Must be one of ${XBCI}, ${XLCI}`,
        statusCode: 400,
      })
  }
}
