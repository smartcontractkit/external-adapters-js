import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: true
 *    DEFAULT_QUOTE:
 *      required: false
 *      default: USD
 */

export type Config = {
  rpcUrl: string
  network: string
}

export const makeConfig = (network = 'mainnet'): Config => {
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    network,
  }
}
