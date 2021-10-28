import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { makeMiddleware, Validator, withMiddleware } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import { makeExecute } from '../adapter'

export const supportedEndpoints = ['token-index']

export function getAllocations(
  context: AdapterContext,
  id: string,
  contractAddress: string,
  setAddress: string,
): Promise<TA.types.TokenAllocation[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'allocations',
      contractAddress,
      setAddress,
      maxAge: 60 * 1000, // 1 minute
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context).then((value) => resolve(value.data))
      })
      .catch((error) => reject(error))
  })
}

export const inputParameters: InputParameters = {
  address: true,
  adapter: true,
  source: false,
  quote: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const contractAddress = validator.validated.data.address
  const adapter = validator.validated.data.adapter
  const allocations = await getAllocations(context, jobRunID, adapter, contractAddress)

  const _execute = TA.makeExecute()
  return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
}
