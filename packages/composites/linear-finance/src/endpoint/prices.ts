import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { deriveAllocations } from '../tokenAllocationDeriver'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const supportedEndpoints = ['prices']

export const inputParameters: InputParameters = {
  index: {
    required: true,
    options: ['xbci', 'xlci'],
    description: 'The index to query',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context) => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.jobRunID
  const index = validator.validated.data.index.toLowerCase()
  const allocations = await deriveAllocations(index, input.id, context)
  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}
