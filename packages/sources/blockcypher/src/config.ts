import { Requester } from '@chainlink/ea-bootstrap'
import { ConfigFactory } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *
 */

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig: ConfigFactory = (prefix?) => Requester.getDefaultConfig(prefix)
