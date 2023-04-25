import {
  AdapterConfigError,
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import {
  getAddressResolver,
  getContractAddress,
  getDataFromAcrossChains,
  getDebtMigratorName,
  inputParameters as commonInputParameters,
} from '../utils'
import { Config } from '../config'
import { DEBT_MIGRATOR_ABI, SYNTHETIX_DEBT_SHARE_ABI } from './abi'
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
      const networkProvider = new ethers.providers.JsonRpcProvider(
        config.chains[network].rpcURL,
        config.chains[network].chainId,
      )
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
        const debtShareTotalSupply = await synthetixDebtShare.totalSupply({ blockTag: blockNumber })

        const debtMigratorAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          getDebtMigratorName(network, jobRunID),
        )
        const debtMigrator = new ethers.Contract(
          debtMigratorAddress,
          DEBT_MIGRATOR_ABI,
          networkProvider,
        )
        const debtTransferReceived = await debtMigrator.debtTransferReceived({
          blockTag: blockNumber,
        })
        const debtTransferSent = await debtMigrator.debtTransferSent({ blockTag: blockNumber })
        const chainTotalDebtShare = debtShareTotalSupply.add(
          debtTransferSent.sub(debtTransferReceived),
        )
        return {
          totalDebtIssued: issuedSynths,
          totalDebtShares: chainTotalDebtShare,
        }
      } catch (e: any) {
        const error = e as any
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
