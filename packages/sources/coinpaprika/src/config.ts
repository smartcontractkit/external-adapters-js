import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *
 */

export const NAME = 'COINPAPRIKA'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.coinpaprika.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
  }
  return config
}
