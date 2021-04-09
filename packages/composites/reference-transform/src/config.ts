import { util, Requester } from '@chainlink/ea-bootstrap'
import legos from '@chainlink/ea'
import { Config as DefaultConfig } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    (SOURCE)_DATA_PROVIDER_URL:
 *      required: true
 *    RPC_URL:
 *      required: true
 */

export type Config = {
  sources: { [name: string]: DefaultConfig }
}

export const ENV_DATA_PROVIDER_URL = 'DATA_PROVIDER_URL'

export const makeConfig = (prefix = ''): Config => {
  const sources: { [name: string]: DefaultConfig } = {}

  for (const a of legos.sources) {
    const url = util.getEnv(ENV_DATA_PROVIDER_URL, a.toUpperCase())
    if (url) {
      const defaultConfig = Requester.getDefaultConfig(prefix)
      defaultConfig.api.baseURL = url
      defaultConfig.api.method = 'post'
      sources[a.toLowerCase()] = defaultConfig
    }
  }

  return {
    sources,
  }
}
