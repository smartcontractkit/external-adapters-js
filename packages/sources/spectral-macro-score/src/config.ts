import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SPECTRAL_MACRO_SCORE'

export const DEFAULT_BASE_URL = 'https://macro-api-test.spectral.finance/api'
export const DEFAULT_ENDPOINT = 'submit'

export const DEFAULT_TIMEOUT = 60000

export interface SpectralAdapterConfig extends Config {
  BASE_URL_MACRO_API: string
  BASE_URL_FAST_API: string
  MACRO_API_KEY: string
  FAST_API_KEY: string
  INFURA_URL: string
  INFURA_API_KEY: string
  NFC_REGISTRY_ADDRESS: string
  timeout: number
}

export const makeConfig = (prefix?: string): SpectralAdapterConfig => {
  const config = <SpectralAdapterConfig>Requester.getDefaultConfig(prefix)
  config.timeout = DEFAULT_TIMEOUT
  config.BASE_URL_MACRO_API = util.getRequiredEnv('BASE_URL_MACRO_API')
  config.BASE_URL_FAST_API = util.getRequiredEnv('BASE_URL_FAST_API')
  config.MACRO_API_KEY = util.getRequiredEnv('MACRO_API_KEY')
  config.FAST_API_KEY = util.getRequiredEnv('FAST_API_KEY')
  config.INFURA_URL = util.getRequiredEnv('INFURA_URL')
  config.INFURA_API_KEY = util.getRequiredEnv('INFURA_API_KEY')
  config.NFC_REGISTRY_ADDRESS = util.getRequiredEnv('NFC_REGISTRY_ADDRESS')
  config.api.headers = {
    'Content-Type': 'application/json',
  }
  return config
}
