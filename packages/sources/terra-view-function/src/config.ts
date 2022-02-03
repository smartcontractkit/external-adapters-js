import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'TERRA_VIEW_FUNCTION'

export const DEFAULT_ENDPOINT = 'view'

export const SUPPORTED_CHAIN_IDS = ['columbus-5', 'bombay-12', 'localterra'] as const
export type ChainId = typeof SUPPORTED_CHAIN_IDS[number]

export const ENV_DEFAULT_CHAIN_ID = 'DEFAULT_CHAIN_ID'
export const DEFAULT_CHAIN_ID = 'columbus-5'

export const ENV_RPC_URL = 'RPC_URL'

export type Config = BaseConfig & {
  rpcUrls: Partial<Record<ChainId, string>>
  defaultChainId: string
}

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = Requester.getDefaultConfig(prefix)

  return {
    ...baseConfig,
    rpcUrls: buildRpcUrlMapping(),
    defaultChainId: util.getEnv(ENV_DEFAULT_CHAIN_ID, prefix) || DEFAULT_CHAIN_ID,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}

const buildRpcUrlMapping = () => {
  const output: Partial<Record<ChainId, string>> = {}
  let hasAtLeastOneURL = false
  for (const chainId of SUPPORTED_CHAIN_IDS) {
    // Underscore-ize and capitalize to format for environment variables
    const prefix = chainId.replace('-', '_').toUpperCase()
    const envVar = util.getEnv(ENV_RPC_URL, prefix)
    if (envVar) {
      output[chainId] = envVar
      hasAtLeastOneURL = true
    }
  }

  if (!hasAtLeastOneURL) throw new Error('At least one RPC URL must be defined')

  return output
}
