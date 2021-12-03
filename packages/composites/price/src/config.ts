import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

export interface Config extends DefaultConfig {
  anchorVaultContractAddress: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.rpcUrl = util.getRequiredEnv('RPC_URL', prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT

  return {
    ...config,
    anchorVaultContractAddress: util.getRequiredEnv('ANCHOR_VAULT_CONTRACT_ADDRESS', prefix),
  }
}
