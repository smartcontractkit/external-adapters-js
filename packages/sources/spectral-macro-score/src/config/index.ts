import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

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
  config.api = {
    ...config.api,
    baseURL: config.api?.baseURL || DEFAULT_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey ?? '',
    },
  }
  config.rpcUrl = util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix)
  config.nfcAddress = util.getRequiredEnv('NFC_ADDRESS')
  return config
}
