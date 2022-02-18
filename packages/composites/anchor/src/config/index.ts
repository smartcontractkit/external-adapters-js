import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_TOKEN_DECIMALS = 18
export const NAME = 'ANCHOR'

export const DEFAULT_ANCHOR_VAULT_CONTRACT_ADDRESS = '0xA2F987A546D4CD1c607Ee8141276876C26b72Bdf'
export const DEFAULT_TERRA_BLUNA_CONTRACT_ADDRESS = 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'
export const DEFAULT_STETH_POOL_CONTRACT_ADDRESS = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'

export interface Config extends DefaultConfig {
  anchorVaultContractAddress: string
  terraBLunaContractAddress: string
  stEthPoolContractAddress: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    defaultEndpoint: util.getEnv('API_ENDPOINT', prefix) || DEFAULT_ENDPOINT,
    anchorVaultContractAddress:
      util.getEnv('ANCHOR_VAULT_CONTRACT_ADDRESS', prefix) || DEFAULT_ANCHOR_VAULT_CONTRACT_ADDRESS,
    terraBLunaContractAddress:
      util.getEnv('TERRA_BLUNA_CONTRACT_ADDRESS', prefix) || DEFAULT_TERRA_BLUNA_CONTRACT_ADDRESS,
    stEthPoolContractAddress:
      util.getEnv('STETH_POOL_CONTRACT_ADDRESS', prefix) || DEFAULT_STETH_POOL_CONTRACT_ADDRESS,
  }
}
