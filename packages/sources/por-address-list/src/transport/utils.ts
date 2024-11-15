import { ethers } from 'ethers'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('utils')

export const fetchAddressList = async <T>(
  addressManager: ethers.Contract,
  latestBlockNum: number,
  confirmations = 0,
  batchSize = 10,
  batchGroupSize = 10,
): Promise<T[]> => {
  const blockTag = latestBlockNum - confirmations
  const numAddresses = await addressManager.getPoRAddressListLength({
    blockTag,
  })
  let totalRequestedAddressesCount = 0
  let startIdx = ethers.BigNumber.from(0)
  const addresses: T[] = []
  let batchRequests: Promise<T[]>[] = []

  while (totalRequestedAddressesCount < numAddresses.toNumber()) {
    const nextEndIdx = startIdx.add(batchSize)
    const endIdx = nextEndIdx.gte(numAddresses) ? numAddresses.sub(1) : nextEndIdx
    const batchCall = addressManager.getPoRAddressList(startIdx, endIdx, { blockTag })
    batchRequests.push(batchCall)
    // element at endIdx is included in result
    const addressesRequested: number = endIdx.sub(startIdx).add(1).toNumber()
    totalRequestedAddressesCount += addressesRequested
    startIdx = endIdx.add(1)

    if (
      batchRequests.length >= batchGroupSize ||
      totalRequestedAddressesCount >= numAddresses.toNumber()
    ) {
      addresses.push(...(await Promise.all(batchRequests)).flat())
      batchRequests = []
    }
  }
  return addresses
}

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
        message: `Missing ${networkName}_RPC_URL or ${networkName}_RPC_URL environment variables`,
      })
    }
  } else {
    return providers[networkName]
  }
}
