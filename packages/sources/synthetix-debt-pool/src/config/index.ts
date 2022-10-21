import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'

export const DEFAULT_ETHEREUM_CHAIN_ID = '1'
export const DEFAULT_KOVAN_CHAIN_ID = '42'
export const DEFAULT_OPTIMISM_CHAIN_ID = '10'
export const DEFAULT_KOVAN_OPTIMISM_CHAIN_ID = '69'
export const DEFAULT_GOERLI_CHAIN_ID = '5'
export const DEFAULT_GOERLI_OPTIMISM_CHAIN_ID = '420'

export enum SupportedChains {
  ETHEREUM = 'mainnet',
  OPTIMISM = 'mainnet-ovm',
  KOVAN = 'kovan',
  KOVAN_OPTIMISM = 'kovan-ovm',
  GOERLI = 'goerli',
  GOERLI_OPTIMISM = 'goerli-ovm',
}

export interface Config extends DefaultConfig {
  chains: {
    [key: string]: {
      rpcURL: string
      chainId: string | number | undefined
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
    const chainRpcURL = util.getEnv(ENV_RPC_URL, envVarPrefix)
    const chainId =
      parseInt(util.getEnv(ENV_CHAIN_ID, envVarPrefix) || getDefaultChainId(chainName)) ||
      util.getEnv(ENV_CHAIN_ID, envVarPrefix)

    const chainAddressResolverProxyAddress =
      util.getEnv('ADDRESS_RESOLVER_PROXY_CONTRACT_ADDRESS', envVarPrefix) ||
      getDefaultAddressResolverProxyAddress(chainName)
    if (chainRpcURL) {
      config.chains[chainName] = {
        rpcURL: chainRpcURL,
        chainId,
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
    case SupportedChains.GOERLI:
      return 'GOERLI'
    case SupportedChains.GOERLI_OPTIMISM:
      return 'GOERLI_OPTIMISM'
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
    case SupportedChains.GOERLI:
      return '0x58719E8Ef4d201541e44505a2ACB3424481d6681'
    case SupportedChains.GOERLI_OPTIMISM:
      return '0x9Fc84992dF5496797784374B810E04238728743d'
  }
}

const getDefaultChainId = (networkName: SupportedChains): string => {
  switch (networkName) {
    case SupportedChains.ETHEREUM:
      return DEFAULT_ETHEREUM_CHAIN_ID
    case SupportedChains.KOVAN:
      return DEFAULT_KOVAN_CHAIN_ID
    case SupportedChains.OPTIMISM:
      return DEFAULT_OPTIMISM_CHAIN_ID
    case SupportedChains.KOVAN_OPTIMISM:
      return DEFAULT_KOVAN_OPTIMISM_CHAIN_ID
    case SupportedChains.GOERLI:
      return DEFAULT_GOERLI_CHAIN_ID
    case SupportedChains.GOERLI_OPTIMISM:
      return DEFAULT_GOERLI_OPTIMISM_CHAIN_ID
  }
}
