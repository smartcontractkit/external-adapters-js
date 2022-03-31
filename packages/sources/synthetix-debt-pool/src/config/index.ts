import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

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
      chainAddressResolverAddress: string
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
    const chainAddressResolverAddress =
      util.getEnv('ADDRESS_RESOLVER_CONTRACT_ADDRESS', envVarPrefix) ||
      getDefaultAddressResolverAddress(chainName)
    if (chainRpcURL) {
      config.chains[chainName] = {
        rpcURL: chainRpcURL,
        chainAddressResolverAddress,
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

const getDefaultAddressResolverAddress = (networkName: SupportedChains): string => {
  switch (networkName) {
    case SupportedChains.ETHEREUM:
      return '0x823bE81bbF96BEc0e25CA13170F5AaCb5B79ba83'
    case SupportedChains.KOVAN:
      return '0x84f87E3636Aa9cC1080c07E6C61aDfDCc23c0db6'
    case SupportedChains.OPTIMISM:
      return '0x95A6a3f44a70172E7d50a9e28c85Dfd712756B8C'
    case SupportedChains.KOVAN_OPTIMISM:
      return '0xb08b62e1cdfd37eCCd69A9ACe67322CCF801b3A6'
  }
}
