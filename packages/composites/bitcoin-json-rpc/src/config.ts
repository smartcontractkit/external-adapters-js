import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: false
 *      default: http://localhost:8545
 */

export const DEFAULT_ENDPOINT = 'difficulty'

// TODO: needs to setup config for underlying JSON-RPC adapter
export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
