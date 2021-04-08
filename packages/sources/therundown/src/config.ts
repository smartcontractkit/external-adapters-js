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
 *       default: https://therundown-therundown-v1.p.rapidapi.com/
 */

export const DEFAULT_ENDPOINT = 'total-score'
export const DEFAULT_BASE_URL = 'https://therundown-therundown-v1.p.rapidapi.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    headers: {
      ...config.api.headers,
      'x-rapidapi-host': 'therundown-therundown-v1.p.rapidapi.com',
    },
  }
  return config
}
