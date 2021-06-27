import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    API_SECRET:
 *      required: true
 *    API_USER:
 *      required: true
 *    API_URL:
 *      required: false
 *      default: https://publicapi.v2.mistertango.com
 */

export const NAME = 'getbalance'

export const DEFAULT_ENDPOINT = 'example'
export const DEFAULT_BASE_URL = 'https://publicapi.v2.mistertango.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.apiSecret = util.getRequiredEnv('API_SECRET', prefix)
  config.api.apiUser = util.getRequiredEnv('API_USER', prefix)

  config.api.method = 'POST'
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.headers = {
    ...config.api.headers,
    'X-API-KEY': config.apiKey,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  return config
}
