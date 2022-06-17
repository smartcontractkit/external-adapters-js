import { types } from '@chainlink/token-allocation-adapter'
import { makeMiddleware, withMiddleware } from '@chainlink/ea-bootstrap'
import { AdapterContext } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'

export const deriveAllocations = async (
  index: string,
  jobRunID: string,
  context: AdapterContext,
): Promise<types.TokenAllocations> => {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'allocations',
      index,
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    method: 'post',
    id: jobRunID,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute, undefined, endpointSelector)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          // TODO: makeExecute response type
          .then((value) => resolve(value.data.allocations as any))
          .catch(reject)
      })
      .catch(reject)
  })
}
