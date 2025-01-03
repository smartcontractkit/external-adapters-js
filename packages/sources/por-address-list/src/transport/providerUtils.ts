import { ethers } from 'ethers'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('utils')

export const addProvider = (
  network: string,
  providers: Record<string, ethers.providers.JsonRpcProvider>,
) => {
  if (!providers[network]) {
    const networkName = network.toUpperCase()
    const networkEnvName = `${networkName}_RPC_URL`
    const chainIdEnvName = `${networkName}_RPC_CHAIN_ID`

    const rpcUrl = process.env[networkEnvName]
    const chainId = Number(process.env[chainIdEnvName])

    if (!rpcUrl || isNaN(chainId)) {
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
  networkName: string,
  providers: Record<string, ethers.providers.JsonRpcProvider>,
  provider?: ethers.providers.JsonRpcProvider,
) => {
  if (!providers[networkName]) {
    if (provider) {
      return provider
    } else {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing ${networkName}_RPC_URL or ${networkName}_RPC_CHAIN_ID environment variables`,
      })
    }
  } else {
    return providers[networkName]
  }
}
