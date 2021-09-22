import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SPECTRAL_MACRO_SCORE'

export const DEFAULT_ENDPOINT = 'spectral-proxy'
export const DEFAULT_BASE_URL = 'https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default/'
export const DEFAULT_TIMEOUT = 60000

export interface SpectralAdapterConfig extends Config {
  rpcUrl: string
  nfcAddress: string
}

export const makeConfig = (prefix?: string): SpectralAdapterConfig => {
  const config = <SpectralAdapterConfig>Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.timeout = DEFAULT_TIMEOUT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.nfcAddress = util.getRequiredEnv('NFC_ADDRESS')
  config.api.headers = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey ?? '',
  }
  return config
}
