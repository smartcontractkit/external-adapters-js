import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Execute, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { makeConfig, Config, INDICES } from './config'
import { parseData } from './csv'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const inputParameters: InputParameters = {
  index: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID

  const index = validator.validated.data.index.toLowerCase()

  if (!INDICES.includes(index))
    throw new AdapterError({
      jobRunID,
      message: `${index} not supported. Must be one of ${INDICES}`,
      statusCode: 400,
    })

  const csvData = config.indices[index]

  if (!csvData)
    throw new AdapterError({
      jobRunID,
      message: `${index} CSV is not configured`,
      statusCode: 400,
    })

  const allocations = await parseData(csvData)

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
