import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_USERNAME:
 *      required: true
 *    API_PASSWORD:
 *      required: true
 *
 */

export const DEFAULT_ENDPOINT = 'values'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://oracleprod1.cfbenchmarks.com/api'
  config.api.auth = {
    username: util.getEnv('API_USERNAME', prefix) || '',
    password: util.getEnv('API_PASSWORD', prefix) || '',
  }
  return config
}
