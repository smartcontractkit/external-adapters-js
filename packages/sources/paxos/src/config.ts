import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables: {}
 */

export const DEFAULT_ENDPOINT = 'assetAttestation'

export const BASE_URL = 'https://api.paxos.com/v1/'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
