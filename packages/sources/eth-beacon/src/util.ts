import { endpointSelector, makeExecute } from './adapter'
import {
  AdapterData,
  AdapterResponseData,
  makeMiddleware,
  withMiddleware,
} from '@chainlink/ea-bootstrap'
import { AdapterContext, Config } from '@chainlink/ea-bootstrap'
import * as endpoints from './endpoint'

export function requestSelf(
  context: AdapterContext,
  id: string,
  input: endpoints.TInputParameters & { endpoint: string },
): Promise<AdapterResponseData<AdapterData>> {
  const execute = makeExecute()
  const options = {
    data: input,
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware<Config, endpoints.TInputParameters>(
      execute,
      undefined,
      endpointSelector,
    )
    withMiddleware<endpoints.TInputParameters>(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          .then((value) => resolve(value.data))
          .catch(reject)
      })
      .catch((error) => reject(error))
  })
}
