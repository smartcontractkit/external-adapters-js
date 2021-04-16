import { util } from '@chainlink/ea-bootstrap'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_PROVIDER:
 *      required: false
 *    API_KEY:
 *      required: true
 *    SYMBOLS:
 *      required: true
 */

export const NAME = 'INTRINIO'

export const PROVIDER_OPTIONS = ['iex', 'quodd', 'fxcm']

export type Config = {
  key: string
  symbols: string
  provider: string
}

export const makeConfig = (prefix?: string): Config => {
  let provider = util.getEnv('API_PROVIDER', prefix) || ''
  if (!PROVIDER_OPTIONS.includes(provider)) {
    provider = PROVIDER_OPTIONS[0]
  }

  return {
    key: util.getRequiredEnv('API_KEY', prefix),
    symbols: util.getRequiredEnv('SYMBOLS', prefix),
    provider: provider.toLowerCase(),
  }
}
