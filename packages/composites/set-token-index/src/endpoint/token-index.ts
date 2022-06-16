import { AdapterContext, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import {
  AdapterDataProviderError,
  makeMiddleware,
  util,
  Validator,
  withMiddleware,
} from '@chainlink/ea-bootstrap'
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
        executeWithMiddleware(options, context)
          // TODO: makeExecute return types
          .then((value) => resolve(value.data as any))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}

export type TInputParameters = {
  address: string
  adapter: string
  source?: string
  quote?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  address: {
    required: true,
    description: 'Address of the SetToken',
  },
  adapter: {
    required: true,
    description: 'Address of the adapter contract',
  },
  source: { required: false },
  quote: { required: false },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const contractAddress = validator.validated.data.address
  const adapter = validator.validated.data.adapter
  const allocations = await getAllocations(context, jobRunID, adapter, contractAddress)

  const _execute = TA.makeExecute()
  try {
    return await _execute({ id: jobRunID, data: { ...input.data, allocations } }, context)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
