import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *
 */

export const DEFAULT_API_ENDPOINT = 'https://web3api.io'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['x-api-key'] = config.apiKey
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
