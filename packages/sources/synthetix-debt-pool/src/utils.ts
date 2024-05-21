import {
  Validator,
  Requester,
  Logger,
  AdapterInputError,
  AdapterDataProviderError,
  AdapterConnectionError,
  AdapterConfigError,
} from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { SupportedChains, Config } from './config'
import { AdapterError } from '@chainlink/ea-bootstrap'
import { READ_PROXY_ABI, ADDRESS_RESOLVER_ABI } from './endpoint/abi'

export type TInputParameters = { chainSources: string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are "mainnet", "mainnet-ovm", "kovan", "kovan-ovm", "goerli", "goerli-ovm", "sepolia", "sepolia-ovm"`,
    type: 'array',
  },
}

type GetDebtData = (
  jobRunID: string,
  config: Config,
  chainsToQuery: [string, number][],
) => Promise<ethers.BigNumber>

export const getDataFromAcrossChains = async (
  request: AdapterRequest,
  config: Config,
  getDebtData: GetDebtData,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  let { chainSources } = validator.validated.data

  if (!chainSources) {
    Logger.info('chainSources is undefined.  Will aggregate debt over all supported chains')
    chainSources = [SupportedChains.ETHEREUM, SupportedChains.OPTIMISM]
  }
  validateChainSources(jobRunID, chainSources)
  // Pin to current moment's latest blocks to ensure time consistency
  const latestBlockByChain = await getLatestBlockByChain(jobRunID, config, chainSources)
  const debt = await getDebtData(jobRunID, config, latestBlockByChain)
  const result = {
    data: {
      result: debt.toString(),
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}

const validateChainSources = (jobRunID: string, chainSources: string[]) => {
  const supportedChains = Object.values(SupportedChains) as string[]
  for (const source of chainSources) {
    if (!supportedChains.includes(source)) {
      throw new AdapterInputError({
        jobRunID,
        message: `${source} is not a supported chain.  Must be one of ${supportedChains.join(',')}`,
      })
    }
  }
}

export const getAddressResolver = async (
  provider: ethers.providers.JsonRpcProvider,
  addressResolverProxyAddress: string,
  jobRunID: string,
  network: string,
): Promise<string> => {
  try {
    const addressResolver = new ethers.Contract(
      addressResolverProxyAddress,
      READ_PROXY_ABI,
      provider,
    )
    return await addressResolver.target()
  } catch (e) {
    return errorResponse(
      e,
      jobRunID,
      network,
      `Failed to fetch address resolver. Error Message: ${e}`,
    )
  }
}

export const getContractAddress = async (
  provider: ethers.providers.JsonRpcProvider,
  addressResolverAddress: string,
  contractName: string,
  jobRunID: string,
  network: string,
): Promise<string> => {
  try {
    const addressResolver = new ethers.Contract(
      addressResolverAddress,
      ADDRESS_RESOLVER_ABI,
      provider,
    )
    const contractNameBytes32 = ethers.utils.formatBytes32String(contractName)
    return await addressResolver.getAddress(contractNameBytes32)
  } catch (e) {
    return errorResponse(
      e,
      jobRunID,
      network,
      `Failed to fetch ${contractName} contract address from resolver address - ${addressResolverAddress}. Error Message: ${e}`,
    )
  }
}

export const getSynthetixBridgeName = (networkName: string, jobRunID: string): string => {
  if (
    networkName === SupportedChains.ETHEREUM ||
    networkName === SupportedChains.KOVAN ||
    networkName === SupportedChains.GOERLI ||
    networkName === SupportedChains.SEPOLIA
  )
    return 'SynthetixBridgeToOptimism'
  if (
    networkName === SupportedChains.OPTIMISM ||
    networkName === SupportedChains.KOVAN_OPTIMISM ||
    networkName === SupportedChains.GOERLI_OPTIMISM ||
    networkName === SupportedChains.SEPOLIA_OPTIMISM
  )
    return 'SynthetixBridgeToBase'
  throw new AdapterInputError({
    jobRunID,
    message: `${networkName} is not a supported network.}`,
  })
}

export const getDebtMigratorName = (networkName: string, jobRunID: string): string => {
  if (
    networkName === SupportedChains.ETHEREUM ||
    networkName === SupportedChains.GOERLI ||
    networkName === SupportedChains.SEPOLIA
  )
    return 'DebtMigratorOnEthereum'
  if (
    networkName === SupportedChains.OPTIMISM ||
    networkName === SupportedChains.GOERLI_OPTIMISM ||
    networkName === SupportedChains.SEPOLIA_OPTIMISM
  )
    return 'DebtMigratorOnOptimism'
  throw new AdapterInputError({
    jobRunID,
    message: `${networkName} is not a supported network.}`,
  })
}

export const getLatestBlockByChain = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: string[],
): Promise<[string, number][]> =>
  await Promise.all(
    chainsToQuery.map(async (network): Promise<[string, number]> => {
      if (!config.chains[network])
        throw new AdapterConfigError({
          jobRunID,
          statusCode: 500,
          message: `Chain ${network} not configured`,
        })

      try {
        const networkProvider = new ethers.providers.JsonRpcProvider(config.chains[network].rpcURL)
        const latestBlock = await networkProvider.getBlockNumber()
        return [network, latestBlock]
      } catch (e: any) {
        const error = e as any
        const errorPayload = {
          jobRunID,
          message: `Failed to fetch latest block data from chain ${network}.  Error Message: ${error}`,
        }
        throw error.response
          ? new AdapterDataProviderError(errorPayload)
          : error.request
          ? new AdapterConnectionError(errorPayload)
          : new AdapterError(errorPayload)
      }
    }),
  )

export const errorResponse = (error: any, jobRunID: string, network: string, message: string) => {
  const errorPayload = {
    jobRunID,
    network,
    message,
  }
  throw error.response
    ? new AdapterDataProviderError(errorPayload)
    : error.request
    ? new AdapterConnectionError(errorPayload)
    : new AdapterError(errorPayload)
}
