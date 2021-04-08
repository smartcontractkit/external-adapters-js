import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_ENDPOINT:
 *      required: false
 *      default: https://sochain.com
 */

export const DEFAULT_API_ENDPOINT = 'https://sochain.com'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
