import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'CURVE'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_ADDRESS_PROVIDER = 'ADDRESS_PROVIDER'
export const ENV_EXCHANGE_PROVIDER_ID = 'EXCHANGE_PROVIDER_ID'
export const ENV_BLOCKCHAIN_NETWORK = 'BLOCKCHAIN_NETWORK'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_ADDRESS_PROVIDER = '0x0000000022D53366457F9d5E68Ec105046FC4383'
export const DEFAULT_EXCHANGE_PROVIDER_ID = 2
export const DEFAULT_BLOCKCHAIN_NETWORK = 'ethereum'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
  addressProviderAddress: string
  exchangeProviderId: number
  network: string
}

export const makeConfig: ConfigFactory<Config> = (prefix) => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix)),
    addressProviderAddress: util.getEnv(ENV_ADDRESS_PROVIDER, prefix) || DEFAULT_ADDRESS_PROVIDER,
    exchangeProviderId:
      Number(util.getEnv(ENV_EXCHANGE_PROVIDER_ID, prefix)) || DEFAULT_EXCHANGE_PROVIDER_ID,
    network: util.getEnv(ENV_BLOCKCHAIN_NETWORK, prefix) || DEFAULT_BLOCKCHAIN_NETWORK,
  }
}
