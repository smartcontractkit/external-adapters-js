import { util, Requester } from '@chainlink/ea-bootstrap'
import { NAME } from '@chainlink/token-allocation-adapter'
import { RequestConfig } from '@chainlink/types'

export type Config = {
  rpcUrl: string
  registryAddr: string
  taConfig: RequestConfig
}

export const makeConfig = (prefix = ''): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = util.getRequiredEnv(`${NAME}_DATA_PROVIDER_URL`)
  defaultConfig.api.method = 'post'
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    registryAddr: util.getRequiredEnv('REGISTRY_ADDRESS'),
    taConfig: defaultConfig.api,
  }
}
