import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: false
 *    API_ENDPOINT:
 *      required: false
 *      default: https://data.messari.io/api/v1/
 */

export const DEFAULT_ENDPOINT = 'assets'
export const DEFAULT_BASE_URL = 'https://data.messari.io/api/v1/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
