import { util } from '@chainlink/ea-bootstrap'
import * as ta from '@chainlink/token-allocation-adapter'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    DEFAULT_NETWORK:
 *      required: false
 *      default: mainnet
 *    DEFAULT_QUOTE:
 *      required: false
 *      default: USD
 */

export type Config = {
  defaultNetwork: string
  taConfig: ta.types.Config
}

export const makeConfig = (prefix = ''): Config => {
  return {
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || 'mainnet',
    taConfig: ta.makeConfig(prefix),
  }
}
