import { AdapterConfigError } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'
import {
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
  getSynthetixBridgeName,
  getAddressResolver,
  errorResponse,
} from '../utils'
import { Config } from '../config'
import { getContractAddress } from '../utils'
import { DEBT_CACHE_ABI, SYNTHETIX_BRIDGE_ABI } from './abi'

export const inputParameters = commonInputParameters
export const supportedEndpoints = ['debt']

export const execute: ExecuteWithConfig<Config, InputParameters> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getTotalDebtIssued)

/**
 * Get the debt issued from multiple chains.
 *
 * The issued synths for a single chain can be calculated using:
 * DebtCache.currentDebt() + SynthetixBridge.synthTransferReceived() - SynthetixBridge.synthTransferSent()
 *
 * This was updated in SIP-229, see https://sips.synthetix.io/sips/sip-229/
 * @param jobRunID string
 * @param config
 * @param chainsToQuery [string, number][]
 * @returns [network, block number, debt amount][] - [string, number, BigNumber][]
 */
export const getDebtIssued = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: [string, number][],
): Promise<[string, number, BigNumber][]> =>
  await Promise.all(
    chainsToQuery.map(async ([network, blockNumber]): Promise<[string, number, BigNumber]> => {
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

      try {
        const addressResolverAddress = await getAddressResolver(
          networkProvider,
          config.chains[network].chainAddressResolverProxyAddress,
          jobRunID,
          network,
        )

        const debtCacheAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          'DebtCache',
          jobRunID,
          network,
        )
        let debtIssued
        try {
          const debtCache = new ethers.Contract(debtCacheAddress, DEBT_CACHE_ABI, networkProvider)
          debtIssued = await debtCache.currentDebt({ blockTag: blockNumber })[0]
        } catch (e) {
          return errorResponse(
            e,
            jobRunID,
            network,
            `Failed to fetch current debt from DebtCache contract. Error Message: ${e}`,
          )
        }

        const synthetixBridgeAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          getSynthetixBridgeName(network, jobRunID),
          jobRunID,
          network,
        )
        let synthetixBridge
        let synthTransferReceived
        try {
          synthetixBridge = new ethers.Contract(
            synthetixBridgeAddress,
            SYNTHETIX_BRIDGE_ABI,
            networkProvider,
          )
          synthTransferReceived = await synthetixBridge.synthTransferReceived({
            blockTag: blockNumber,
          })
        } catch (e) {
          return errorResponse(
            e,
            jobRunID,
            network,
            `Failed to fetch synthTransferReceived.  Error Message: ${e}`,
          )
        }

        let issuedSynths

        try {
          const synthTransferSent = await synthetixBridge.synthTransferSent({
            blockTag: blockNumber,
          })
          issuedSynths = debtIssued.add(synthTransferSent.sub(synthTransferReceived))
        } catch (e) {
          return errorResponse(
            e,
            jobRunID,
            network,
            `Failed to fetch synthTransferSent or calculate issued synths.  Error Message: ${e}`,
          )
        }

        return [network, blockNumber, issuedSynths]
      } catch (e: any) {
        return errorResponse(
          e,
          jobRunID,
          network,
          `Failed to fetch debt data from chain ${network}.  Error Message: ${e}`,
        )
      }
    }),
  )

const getTotalDebtIssued = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: [string, number][],
): Promise<BigNumber> => {
  const chainResponses = await getDebtIssued(jobRunID, config, chainsToQuery)

  let totalDebtIssued = BigNumber.from(0)
  for (const [, , chainSynthesizedDebt] of chainResponses) {
    totalDebtIssued = totalDebtIssued.add(chainSynthesizedDebt)
  }
  return totalDebtIssued
}
