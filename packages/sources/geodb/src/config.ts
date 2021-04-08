import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_ENDPOINT:
 *      required: false
 *      default: http://35.195.237.123:8000/
 */

export const DEFAULT_ENDPOINT = 'matches'
export const DEFAULT_BASE_URL = 'http://35.195.237.123:8000/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
  }
  return config
}
