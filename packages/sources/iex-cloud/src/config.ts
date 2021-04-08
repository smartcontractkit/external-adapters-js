import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    API_ENDPOINT:
 *      required: false
 *      default: https://cloud.iexapis.com/stable
 */

export const NAME = 'IEXCloud'

export const DEFAULT_ENDPOINT = 'stock'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://cloud.iexapis.com/stable'
  return config
}
