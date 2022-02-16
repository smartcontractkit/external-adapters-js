import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'

export enum SUPPORTED_CHAINS {
  ETHEREUM = 'ethereum',
  OPTIMISM = 'optimism',
}

export interface Config extends DefaultConfig {
  chains: {
    [key: string]: string
  }
}

export const makeConfig = (prefix?: string): Config => {
  const config: Config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    chains: {},
  }

  for (const chainName of Object.values(SUPPORTED_CHAINS)) {
    const envVarPrefix = chainName === SUPPORTED_CHAINS.ETHEREUM ? '' : chainName.toUpperCase()
    const chainRpcURL = util.getEnv('RPC_URL', envVarPrefix)
    if (chainRpcURL) {
      config.chains[chainName] = chainRpcURL
    }
  }

  const chains = Object.keys(config.chains)
  if (chains.length === 0) throw Error('Must set at least one RPC Chain URL')
  return config
}
