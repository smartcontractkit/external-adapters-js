import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: true
 *    NETWORK_ID:
 *      required: true
 *    PRIVATE_KEY:
 *      required: true
 */

export const DEFAULT_ENDPOINT = 'conflux'

export type Config = {
  api: any
  rpcUrl: string
  networkId: number
  privateKey: string
}

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    networkId: Number(util.getRequiredEnv('NETWORK_ID')),
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
