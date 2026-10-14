import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { config } from '../config'

const logger = makeLogger('utils')

export const addProvider = (
  network: string,
  settings: typeof config.settings,
  providers: Record<string, ethers.providers.JsonRpcProvider>,
) => {
  if (!providers[network]) {
    const rpcUrl = settings.NETWORK_RPC_URL.get(network)
    const chainId = settings.NETWORK_RPC_CHAIN_ID.get(network)

    if (!rpcUrl || chainId === undefined) {
      const networkEnvName = settings.NETWORK_RPC_URL.getEnvVarName(network)
      const chainIdEnvName = settings.NETWORK_RPC_CHAIN_ID.getEnvVarName(network)
      logger.debug(
        `Missing '${networkEnvName}' or '${chainIdEnvName}' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      return providers
    }

    providers[network] = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
  }

  return providers
}

export const getProvider = (
  network: string,
  settings: typeof config.settings,
  providers: Record<string, ethers.providers.JsonRpcProvider>,
  provider?: ethers.providers.JsonRpcProvider,
) => {
  if (!providers[network]) {
    if (provider) {
      return provider
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing ${settings.NETWORK_RPC_URL.getEnvVarName(
          network,
        )} or ${settings.NETWORK_RPC_CHAIN_ID.getEnvVarName(network)} environment variables`,
      })
    }
  } else {
    return providers[network]
  }
}
