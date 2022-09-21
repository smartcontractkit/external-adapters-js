import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ETH_BEACON'

export const DEFAULT_ENDPOINT = 'balance'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig,
    api: {
      ...defaultConfig.api,
      baseURL: rpcURL,
      headers: {
        Authorization:
          'Bearer api-token-0x0200e6ce18e26fd38caca7ae1bfb9e2bba7efb20ed2746ad17f2f6dda44603152d',
      },
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
