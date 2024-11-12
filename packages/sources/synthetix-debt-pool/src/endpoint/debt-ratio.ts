import { AdapterConfigError } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import {
  errorResponse,
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
      let networkProvider
      try {
        networkProvider = new ethers.providers.JsonRpcProvider(
          config.chains[network].rpcURL,
          config.chains[network].chainId,
        )
      } catch (e) {
        return errorResponse(
          e,
          jobRunID,
          network,
          `Unable to connect to RPC provider. Network - ${network}`,
        )
      }
      const addressResolverAddress = await getAddressResolver(
        networkProvider,
        config.chains[network].chainAddressResolverProxyAddress,
        jobRunID,
        network,
      )
      const synthetixDebtShareAddress = await getContractAddress(
        networkProvider,
        addressResolverAddress,
        'SynthetixDebtShare',
        jobRunID,
        network,
      )
      let debtShareTotalSupply
      try {
        const synthetixDebtShare = new ethers.Contract(
          synthetixDebtShareAddress,
          SYNTHETIX_DEBT_SHARE_ABI,
          networkProvider,
        )
        debtShareTotalSupply = await synthetixDebtShare.totalSupply({ blockTag: blockNumber })
      } catch (e) {
        return errorResponse(
          e,
          jobRunID,
          network,
          `Failed to fetch depth share total supply. Error Message: ${e}`,
        )
      }

      const debtMigratorAddress = await getContractAddress(
        networkProvider,
        addressResolverAddress,
        getDebtMigratorName(network, jobRunID),
        jobRunID,
        network,
      )
      let debtTransferReceived
      let debtMigrator
      try {
        debtMigrator = new ethers.Contract(debtMigratorAddress, DEBT_MIGRATOR_ABI, networkProvider)
        debtTransferReceived = await debtMigrator.debtTransferReceived({
          blockTag: blockNumber,
        })
      } catch (e) {
        return errorResponse(
          e,
          jobRunID,
          network,
          `Failed to fetch debtTransferReceived. Error Message: ${e}`,
        )
      }
      let chainTotalDebtShare
      try {
        const debtTransferSent = await debtMigrator.debtTransferSent({ blockTag: blockNumber })
        chainTotalDebtShare = debtShareTotalSupply.add(debtTransferSent.sub(debtTransferReceived))
      } catch (e) {
        return errorResponse(
          e,
          jobRunID,
          network,
          `Failed to fetch debtTransferSent or calculate total depth shares.  Error Message: ${e}`,
        )
      }

      return {
        totalDebtIssued: issuedSynths,
        totalDebtShares: chainTotalDebtShare,
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
