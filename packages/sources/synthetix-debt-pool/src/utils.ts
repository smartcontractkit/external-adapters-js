import { Validator, Requester, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { SupportedChains, Config } from './config'
import { AdapterError } from '@chainlink/ea-bootstrap'
import { ADDRESS_RESOLVER_ABI } from './endpoint/abi'

export const inputParameters: InputParameters = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are "mainnet", "mainnet-ovm", "kovan", "kovan-ovm"`,
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
      throw new AdapterError({
        jobRunID,
        message: `${source} is not a supported chain.  Must be one of ${supportedChains.join(',')}`,
      })
    }
  }
}

export const getContractAddress = async (
  provider: ethers.providers.JsonRpcProvider,
  addressResolverAddress: string,
  contractName: string,
): Promise<string> => {
  const addressResolver = new ethers.Contract(
    addressResolverAddress,
    ADDRESS_RESOLVER_ABI,
    provider,
  )
  const contractNameBytes32 = ethers.utils.formatBytes32String(contractName)
  return await addressResolver.getAddress(contractNameBytes32)
}

export const getSynthetixBridgeName = (networkName: string, jobRunID: string): string => {
  if (networkName === SupportedChains.ETHEREUM || networkName === SupportedChains.KOVAN)
    return 'SynthetixBridgeToOptimism'
  if (networkName === SupportedChains.OPTIMISM || networkName === SupportedChains.KOVAN_OPTIMISM)
    return 'SynthetixBridgeToBase'
  throw new AdapterError({
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
        throw new AdapterError({
          jobRunID,
          statusCode: 500,
          message: `Chain ${network} not configured`,
        })

      const networkProvider = new ethers.providers.JsonRpcProvider(config.chains[network].rpcURL)
      try {
        const latestBlock = await networkProvider.getBlockNumber()
        return [network, latestBlock]
      } catch (e) {
        throw new AdapterError({
          jobRunID,
          message: `Failed to fetch latest block data from chain ${network}.  Error Message: ${e}`,
        })
      }
    }),
  )
