import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    CLIENT_ID:
 *      required: true
 *
 */

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
