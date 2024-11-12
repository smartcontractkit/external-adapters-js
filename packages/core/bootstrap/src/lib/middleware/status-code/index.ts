import type { AdapterContext, AdapterRequest, Middleware } from '../../../types'

/**
 * Ensure Adapter's response data has the same statusCode as the one we got as a result
 */
export const withStatusCode: <
  R extends AdapterRequest = AdapterRequest,
  C extends AdapterContext = AdapterContext,
>() => Middleware<R, C> = () => async (execute, context) => async (input) => {
  const { statusCode, data, ...rest } = await execute(input, context)
  if (data && typeof data === 'object' && data.statusCode) data.statusCode = statusCode
  return { ...rest, statusCode, data }
}
