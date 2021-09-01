import { ExecuteWithConfig, Config } from '@chainlink/types'
import * as live from './live'

export const supportedEndpoints = ['forex']

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  // HTTP will use the live endpoint for the first request.  Subsequent requests to this endpoint will use WS
  return await live.execute(input, context, config)
}
