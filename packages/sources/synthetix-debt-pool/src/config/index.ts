import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'
import { NetworkId, NetworkIdByName } from '@synthetixio/contracts-interface'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'

export enum SupportedChains {
  ETHEREUM = 'mainnet',
  OPTIMISM = 'mainnet-ovm',
  KOVAN = 'kovan',
  KOVAN_OPTIMISM = 'kovan-ovm',
}

export interface Config extends DefaultConfig {
  chains: {
    [key: string]: {
      rpcURL: string
      networkId: NetworkId
    }
  }
}

export const makeConfig = (prefix?: string): Config => {
  const config: Config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    chains: {},
  }

  for (const chainName of Object.values(SupportedChains)) {
    const envVarPrefix = getRPCUrlPrefix(chainName)
    const chainRpcURL = util.getEnv('RPC_URL', envVarPrefix)
    if (chainRpcURL) {
      config.chains[chainName] = {
        rpcURL: chainRpcURL,
        networkId: NetworkIdByName[chainName],
      }
    }
  }

  const chains = Object.keys(config.chains)
  if (chains.length === 0) throw Error('Must set at least one RPC Chain URL')
  return config
}

const getRPCUrlPrefix = (networkName: SupportedChains): string => {
  switch (networkName) {
    case SupportedChains.ETHEREUM:
      return ''
    case SupportedChains.KOVAN:
      return 'KOVAN'
    case SupportedChains.OPTIMISM:
      return 'OPTIMISM'
    case SupportedChains.KOVAN_OPTIMISM:
      return 'KOVAN_OPTIMISM'
  }
}
