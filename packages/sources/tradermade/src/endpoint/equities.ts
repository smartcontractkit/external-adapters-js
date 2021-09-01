import { ExecuteWithConfig, Config } from '@chainlink/types'

export const supportedEndpoints = ['forex']

export const execute: ExecuteWithConfig<Config> = async () => {
  throw new Error('Endpoint does not support HTTP requests')
}
