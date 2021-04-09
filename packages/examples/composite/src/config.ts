
/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    RPC_URL:
 *      required: true
 *    OPTION:
 *      required: false
 *      default: true
 */

export type Config = {
  source: string
}

export const makeConfig = (): Config => {
  return {
    source: 'test',
  }
}
