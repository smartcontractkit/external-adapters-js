import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'

export enum SUPPORTED_CHAINS {
  ETHEREUM = 'ETHEREUM',
  OPTIMISM = 'OPTIMISM',
}

export interface Config extends DefaultConfig {
  chains: {
    [key: string]: {
      rpcUrl: string
      addressProviderContractAddress: string
    }
  }
}

export const makeConfig = (prefix?: string): Config => {
  const config: Config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    chains: {},
  }

  for (const chainName of Object.values(SUPPORTED_CHAINS)) {
    const chainRpcURL = util.getEnv(`${chainName}_RPC_URL`, prefix)
    const addressProviderContractAddress = util.getEnv(
      `${chainName}_ADDRESS_PROVIDER_CONTRACT_ADDRESS`,
      prefix,
    )
    if (chainRpcURL && addressProviderContractAddress) {
      config.chains[chainName] = {
        rpcUrl: chainRpcURL,
        addressProviderContractAddress,
      }
    }
  }

  const chains = Object.keys(config.chains)
  if (chains.length === 0) throw Error('Must set at least one RPC Chain URL')
  return config
}
