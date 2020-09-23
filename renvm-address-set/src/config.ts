import { logger } from '@chainlink/external-adapter'
import { RenNetwork, isRenNetwork } from '@renproject/interfaces'

export const ENV_NETWORK = 'NETWORK'
export const ENV_API_ENDPOINT = 'API_ENDPOINT'

export const DEFAULT_NETWORK = 'testnet'
export const DEFAULT_TOKEN_OR_CONTRACT = 'BTC'

export type Config = {
  network: RenNetwork | undefined
  api: {
    baseURL: string | undefined
  }
}

export const getConfig = (): Config => {
  const network = process.env[ENV_NETWORK]
  if (network && !isRenNetwork(network)) throw Error(`Unknown Ren network: ${network}`)

  return {
    network: network as RenNetwork | undefined,
    api: {
      baseURL: process.env[ENV_API_ENDPOINT],
    },
  }
}

export const logConfig = (config: Config): void => {
  logger.info('Adapter configuration:', { config })
}
