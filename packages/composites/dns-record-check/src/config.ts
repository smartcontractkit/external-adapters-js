import { Config } from '@chainlink/types'
import DNS from '@chainlink/dns-query-adapter'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables: {}
 */

export const makeConfig = (): Config => {
  return DNS.makeConfig()
}
