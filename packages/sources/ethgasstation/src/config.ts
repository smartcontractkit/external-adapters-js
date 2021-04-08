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
 *      default: https://data-api.defipulse.com
 */

export const DEFAULT_ENDPOINT = 'gasprice'
export const DEFAULT_API_ENDPOINT = 'https://data-api.defipulse.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    params: {
      'api-key': config.apiKey,
    },
  }
  return config
}
