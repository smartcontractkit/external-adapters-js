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
 *      default: https://data.fixer.io
 */

export const NAME = 'FIXER'

export const DEFAULT_ENDPOINT = 'convert'
export const DEFAULT_API_ENDPOINT = 'https://data.fixer.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    params: {
      access_key: config.apiKey,
    },
  }
  return config
}
