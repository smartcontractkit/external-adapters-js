import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SPECTRAL_MACRO_SCORE'

export const DEFAULT_ENDPOINT = 'spectral-proxy'
export const DEFAULT_BASE_URL = 'https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default'

export interface SpectralAdapterConfig extends Config {
  rpcUrl: string
  nfcAddress: string
}

export const makeConfig = (prefix?: string): SpectralAdapterConfig => {
  const config = <SpectralAdapterConfig>Requester.getDefaultConfig(prefix)
  config.api = util.getEnv('API_URL') ?? `${DEFAULT_BASE_URL}/${DEFAULT_ENDPOINT}`
  config.verbose = true
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.nfcAddress = util.getRequiredEnv('NFC_ADDRESS')
  return config
}
