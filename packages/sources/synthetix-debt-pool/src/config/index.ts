import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
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
      chainAddressResolverProxyAddress: string
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
    const chainAddressResolverProxyAddress =
      util.getEnv('ADDRESS_RESOLVER_PROXY_CONTRACT_ADDRESS', envVarPrefix) ||
      getDefaultAddressResolverProxyAddress(chainName)
    if (chainRpcURL) {
      config.chains[chainName] = {
        rpcURL: chainRpcURL,
        chainAddressResolverProxyAddress,
      }
    }
  }

  const chains = Object.keys(config.chains)
  if (chains.length === 0)
    throw new AdapterConfigError({ message: 'Must set at least one RPC Chain URL' })
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

const getDefaultAddressResolverProxyAddress = (networkName: SupportedChains): string => {
  switch (networkName) {
    case SupportedChains.ETHEREUM:
      return '0x4E3b31eB0E5CB73641EE1E65E7dCEFe520bA3ef2'
    case SupportedChains.KOVAN:
      return '0x242a3DF52c375bEe81b1c668741D7c63aF68FDD2'
    case SupportedChains.OPTIMISM:
      return '0x1Cb059b7e74fD21665968C908806143E744D5F30'
    case SupportedChains.KOVAN_OPTIMISM:
      return '0x7a6f9eDDC03Db81927eA4131919343f93CA9b6a7'
  }
}
