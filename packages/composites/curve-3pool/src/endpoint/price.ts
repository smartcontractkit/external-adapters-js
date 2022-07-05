import type { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { makeMiddleware, Validator, withMiddleware } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['price']

export function getAllocations(
  context: AdapterContext,
  id: string,
): Promise<TA.types.TokenAllocation[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'allocations',
      maxAge: 60 * 1000, // 1 minute
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          // NOTE: coercing type because allocations doesn't fit normal responses
          .then((value) => resolve(value.data as unknown as TA.types.TokenAllocations))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

export const inputParameters: InputParameters = {
  source: false,
  quote: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const allocations = await getAllocations(context, jobRunID)

  const _execute = TA.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}
