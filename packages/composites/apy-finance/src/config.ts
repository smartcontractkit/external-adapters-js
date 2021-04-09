import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: true
 *    REGISTRY_ADDRESS:
 *      required: true
 *    DEFAULT_QUOTE:
 *      required: false
 *      default: USD
 */

export type Config = {
  rpcUrl: string
  registryAddr: string
}

export const makeConfig = (): Config => {
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    registryAddr: util.getRequiredEnv('REGISTRY_ADDRESS'),
  }
}
