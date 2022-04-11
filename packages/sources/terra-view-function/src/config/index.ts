import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'TERRA_VIEW_FUNCTION'

export const DEFAULT_ENDPOINT = 'view'

export const SUPPORTED_CHAIN_IDS = ['columbus-5', 'bombay-12', 'localterra'] as const
export type ChainId = typeof SUPPORTED_CHAIN_IDS[number]

export const ENV_DEFAULT_CHAIN_ID = 'DEFAULT_CHAIN_ID'
export const DEFAULT_CHAIN_ID = 'columbus-5'

export const ENV_LCD_URL = 'LCD_URL'
export const ENV_RPC_URL = 'RPC_URL'

export type Config = BaseConfig & {
  lcdUrls: Partial<Record<ChainId, string>>
  defaultChainId: string
}

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = Requester.getDefaultConfig(prefix)

  return {
    ...baseConfig,
    lcdUrls: buildLcdUrlMapping(),
    defaultChainId: util.getEnv(ENV_DEFAULT_CHAIN_ID, prefix) || DEFAULT_CHAIN_ID,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}

const buildLcdUrlMapping = () => {
  const output: Partial<Record<ChainId, string>> = {}
  let hasAtLeastOneURL = false
  for (const chainId of SUPPORTED_CHAIN_IDS) {
    // Underscore-ize and capitalize to format for environment variables
    const prefix = chainId.replace('-', '_').toUpperCase()
    const envVar = util.getEnv(ENV_LCD_URL, prefix)
    const legacyEnvVar = util.getEnv(ENV_RPC_URL, prefix)
    if (envVar) {
      output[chainId] = envVar
      hasAtLeastOneURL = true
    } else if (legacyEnvVar) {
      console.log(
        'The RPC_URL environment variable is being deprecated, please use an LCD_URL instead. See README for more information.',
      )
      output[chainId] = legacyEnvVar
      hasAtLeastOneURL = true
    }
  }
  if (!hasAtLeastOneURL) throw new Error('At least one LCD URL must be defined')

  return output
}
