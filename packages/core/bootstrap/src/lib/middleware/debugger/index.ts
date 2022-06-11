import type { AdapterContext, AdapterRequest, Middleware } from '../../../types'
import { isDebug } from '../../util'

/**
  Adds debug information to the Adapter's response
*/

export const withDebug =
  <
    R extends AdapterRequest = AdapterRequest,
    C extends AdapterContext = AdapterContext,
  >(): Middleware<R, C> =>
  async (execute, context) =>
  async (input) => {
    const result = await execute(input, context)
    if (!isDebug()) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { debug, ...rest } = result
      return rest
    }
    return result
  }
