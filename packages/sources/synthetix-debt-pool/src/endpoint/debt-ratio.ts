import {
  AdapterConfigError,
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import {
  CustomError,
  getAddressResolver,
  getContractAddress,
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
} from '../utils'
import { Config } from '../config'
import { SYNTHETIX_DEBT_SHARE_ABI } from './abi'
import { getDebtIssued } from './debt'

export const inputParameters = commonInputParameters
export const supportedEndpoints = ['debt-ratio']

interface CurrentDebtResults {
  totalDebtIssued: ethers.BigNumber
  totalDebtShares: ethers.BigNumber
}
export const execute: ExecuteWithConfig<Config, InputParameters> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getDebtRatio)

/**
 * Get the total debt ratios summed from multiple chains.
 *
 * The debt ratio can be calculated using:
 * Total Debt Issued / Total Debt Shares
 *
 * @param jobRunID
 * @param config
 * @param chainsToQuery [string, number][]
 * @returns BigNumber
 */
const getDebtRatio = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: [string, number][],
): Promise<BigNumber> => {
  const debtIssued = await getDebtIssued(jobRunID, config, chainsToQuery)
  const chainResponses = await Promise.all(
    debtIssued.map(async ([network, blockNumber, issuedSynths]): Promise<CurrentDebtResults> => {
      if (!config.chains[network])
        throw new AdapterConfigError({
          jobRunID,
          statusCode: 500,
          message: `Chain ${network} not configured`,
        })
      const networkProvider = new ethers.providers.JsonRpcProvider(config.chains[network].rpcURL)
      try {
        const addressResolverAddress = await getAddressResolver(
          networkProvider,
          config.chains[network].chainAddressResolverProxyAddress,
        )
        const synthetixDebtShareAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          'SynthetixDebtShare',
        )
        const synthetixDebtShare = new ethers.Contract(
          synthetixDebtShareAddress,
          SYNTHETIX_DEBT_SHARE_ABI,
          networkProvider,
        )
        const chainTotalDebtShare = await synthetixDebtShare.totalSupply({ blockTag: blockNumber })
        return {
          totalDebtIssued: issuedSynths,
          totalDebtShares: chainTotalDebtShare,
        }
      } catch (e) {
        const error = e as CustomError
        const errorPayload = {
          jobRunID,
          message: `Failed to fetch debt ratio from chain ${network}. Error Message: ${error.message}`,
        }
        throw error.response
          ? new AdapterDataProviderError(errorPayload)
          : error.request
          ? new AdapterConnectionError(errorPayload)
          : new AdapterError(errorPayload)
      }
    }),
  )

  let totalDebtIssued = BigNumber.from(0)
  let totalDebtShares = BigNumber.from(0)

  for (const chain of chainResponses) {
    totalDebtIssued = totalDebtIssued.add(chain.totalDebtIssued)
    totalDebtShares = totalDebtShares.add(chain.totalDebtShares)
  }
  return totalDebtIssued.mul(BigNumber.from(10).pow(27)).div(totalDebtShares)
}
