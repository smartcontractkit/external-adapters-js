import { Middleware } from '@chainlink/types'
import { isDebug } from '../../util'

export const withDebug: Middleware = async (execute, context) => async (input) => {
  const result = await execute(input, context)
  if (!isDebug()) {
    const { debug, ...rest } = result
    return rest
  }
  return result
}
