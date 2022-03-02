import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'
export const FIXED_POINT_DECIMALS = 18
export const NAME = 'ANCHOR'

export const DEFAULT_ANCHOR_VAULT_CONTRACT_ADDRESS = '0xA2F987A546D4CD1c607Ee8141276876C26b72Bdf'
export const DEFAULT_TERRA_BLUNA_CONTRACT_ADDRESS = 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'
export const DEFAULT_STETH_POOL_CONTRACT_ADDRESS = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022'

// Bombay
// TODO:  This is only for testing right now.  Make sure to update these to the Columbus addresses once they have been deployed
export const DEFAULT_LUNA_TERRA_FEED_ADDRESS = 'terra1u475ps69rmhpf4f4gx2pc74l7tlyu4hkj4wp9d'
export const DEFAULT_ETH_TERRA_FEED_ADDRESS = 'terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy'
export const DEFAULT_BTC_TERRA_FEED_ADDRESS = 'terra134m32c6p87df4cjx36vhgxnlhf06pfgvj7jsx7'

export interface Config extends DefaultConfig {
  anchorVaultContractAddress: string
  terraBLunaContractAddress: string
  stEthPoolContractAddress: string
  feedAddresses: {
    [T: string]: string
  }
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
    feedAddresses: {
      luna: util.getEnv('LUNA_TERRA_FEED_ADDRESS', prefix) || DEFAULT_LUNA_TERRA_FEED_ADDRESS,
      eth: util.getEnv('ETH_TERRA_FEED_ADDRESS', prefix) || DEFAULT_ETH_TERRA_FEED_ADDRESS,
      btc: util.getEnv('BTC_TERRA_FEED_ADDRESS', prefix) || DEFAULT_BTC_TERRA_FEED_ADDRESS,
    },
  }
}
