import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'
export const FIXED_POINT_DECIMALS = 18
export const NAME = 'ANCHOR'

export const DEFAULT_ANCHOR_VAULT_CONTRACT_ADDRESS = '0xA2F987A546D4CD1c607Ee8141276876C26b72Bdf'
export const DEFAULT_TERRA_BLUNA_HUB_CONTRACT_ADDRESS =
  'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'
export const DEFAULT_STETH_POOL_CONTRACT_ADDRESS = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'
export const DEFAULT_LUNA_TERRA_FEED_ADDRESS = 'terra1gfy9nxj2xwd4vcupzfelk34u3qjkvp3vcjveg6'
export const DEFAULT_ETH_TERRA_FEED_ADDRESS = 'terra1a39jndcuh64ef2qzt5w8mh46m5ysc34a9qd2e5'
export const DEFAULT_FEED_DECIMALS = 8

export interface Config extends DefaultConfig {
  anchorVaultContractAddress: string
  terraBLunaHubContractAddress: string
  stEthPoolContractAddress: string
  feedDecimals: number
  feedAddresses: {
    [T: string]: string
  }
}

export const makeConfig = (prefix?: string): Config => {
  const feedDecimals = util.getEnv('FEED_DECIMALS', prefix)
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix),
    defaultEndpoint: util.getEnv('API_ENDPOINT', prefix) || DEFAULT_ENDPOINT,
    anchorVaultContractAddress:
      util.getEnv('ANCHOR_VAULT_CONTRACT_ADDRESS', prefix) || DEFAULT_ANCHOR_VAULT_CONTRACT_ADDRESS,
    terraBLunaHubContractAddress:
      util.getEnv('TERRA_BLUNA_HUB_CONTRACT_ADDRESS', prefix) ||
      DEFAULT_TERRA_BLUNA_HUB_CONTRACT_ADDRESS,
    stEthPoolContractAddress:
      util.getEnv('STETH_POOL_CONTRACT_ADDRESS', prefix) || DEFAULT_STETH_POOL_CONTRACT_ADDRESS,
    feedAddresses: {
      luna: util.getEnv('LUNA_TERRA_FEED_ADDRESS', prefix) || DEFAULT_LUNA_TERRA_FEED_ADDRESS,
      eth: util.getEnv('ETH_TERRA_FEED_ADDRESS', prefix) || DEFAULT_ETH_TERRA_FEED_ADDRESS,
    },
    feedDecimals: feedDecimals ? parseInt(feedDecimals) : DEFAULT_FEED_DECIMALS,
  }
}
