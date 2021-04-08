import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_ENDPOINT:
 *      required: false
 *      default: https://core-api.real-time-attest.trustexplorer.io
 */

export const DEFAULT_ENDPOINT = 'trueusd'
export const DEFAULT_BASE_URL = 'https://core-api.real-time-attest.trustexplorer.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
