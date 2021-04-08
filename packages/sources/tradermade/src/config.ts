import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    API_ENDPOINT:
 *       required: false
 *       default: https://marketdata.tradermade.com/api/v1/live
 */

export const NAME = 'TRADERMADE'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://marketdata.tradermade.com/api/v1/live'
  config.api.params = { api_key: config.apiKey }
  return config
}
