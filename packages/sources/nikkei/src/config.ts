import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_ENDPOINT:
 *      required: false
 *      default: https://indexes.nikkei.co.jp/en/nkave/'
 */

export const DEFAULT_ENDPOINT = 'price'

export const DEFAULT_API_ENDPOINT = 'https://indexes.nikkei.co.jp/en/nkave/'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
