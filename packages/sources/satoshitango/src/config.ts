import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_ENDPOINT:
 *      required: false
 *      default: https://api.satoshitango.com/v3
 */

export const DEFAULT_ENDPOINT = 'ticker'
export const DEFAULT_BASE_URL = 'https://api.satoshitango.com/v3'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
