import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SPECTRAL_MACRO_SCORE'

export const DEFAULT_ENDPOINT = 'run_proxy'
export const DEFAULT_BASE_URL = 'https://macro-api-staging.spectral.finance/api/'
export const DEFAULT_TIMEOUT = 60000

export interface SpectralAdapterConfig extends Config {
  rpcUrl: string
  nfcRegistryAddress: string
  timeout: number
}

export const makeConfig = (prefix?: string): SpectralAdapterConfig => {
  const config = <SpectralAdapterConfig>Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.timeout = DEFAULT_TIMEOUT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.nfcRegistryAddress = util.getRequiredEnv('NFC_REGISTRY_ADDRESS')
  config.api.headers = {
    'Content-Type': 'application/json',
    //'x-api-key': config.apiKey ?? '',
  }
  return config
}
