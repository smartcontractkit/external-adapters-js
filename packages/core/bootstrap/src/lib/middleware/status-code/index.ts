import type { Middleware } from '@chainlink/types'

export const withStatusCode: Middleware = async (execute, context) => async (input) => {
  const { statusCode, data, ...rest } = await execute(input, context)
  if (data && typeof data === 'object' && data.statusCode) data.statusCode = statusCode
  return { ...rest, statusCode, data }
}
