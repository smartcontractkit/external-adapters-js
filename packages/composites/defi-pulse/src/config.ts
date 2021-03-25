import { util, Requester } from '@chainlink/ea-bootstrap'
import { NAME } from '@chainlink/token-allocation-adapter'
import { RequestConfig } from '@chainlink/types'

export type Config = {
  rpcUrl: string
  network: string
  taConfig: RequestConfig
}

const DEFAULT_NETWORK = 'mainnet'

export const makeConfig = (prefix = ''): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = util.getRequiredEnv(`${NAME}_DATA_PROVIDER_URL`)
  defaultConfig.api.method = 'post'
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    network: util.getEnv('DEFAULT_NETWORK') || DEFAULT_NETWORK,
    taConfig: defaultConfig.api,
  }
}
