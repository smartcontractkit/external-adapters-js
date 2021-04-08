import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: false
 *
 */

export const DEFAULT_ENDPOINT = 'difficulty'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
