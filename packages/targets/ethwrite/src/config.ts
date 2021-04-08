import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: true
 *    NETWORK:
 *      required: false
 *      default: mainnet
 *    PRIVATE_KEY:
 *      required: true
 */

export type Config = {
  rpcUrl: string
  network?: string
  privateKey: string
  api: any
}

export const DEFAULT_ENDPOINT = 'txsend'

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    network: util.getEnv('NETWORK') || 'mainnet',
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
