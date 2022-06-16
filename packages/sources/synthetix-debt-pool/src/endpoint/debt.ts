import {
  AdapterConfigError,
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { BigNumber, ethers } from 'ethers'
import {
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
  getSynthetixBridgeName,
  getAddressResolver,
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
      const networkProvider = new ethers.providers.JsonRpcProvider(config.chains[network].rpcURL)
      try {
        const addressResolverAddress = await getAddressResolver(
          networkProvider,
          config.chains[network].chainAddressResolverProxyAddress,
        )

        const debtCacheAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          'DebtCache',
        )
        const debtCache = new ethers.Contract(debtCacheAddress, DEBT_CACHE_ABI, networkProvider)
        const [debtIssued] = await debtCache.currentDebt({ blockTag: blockNumber })

        const synthetixBridgeAddress = await getContractAddress(
          networkProvider,
          addressResolverAddress,
          getSynthetixBridgeName(network, jobRunID),
        )
        const synthetixBridge = new ethers.Contract(
          synthetixBridgeAddress,
          SYNTHETIX_BRIDGE_ABI,
          networkProvider,
        )
        const synthTransferReceived = await synthetixBridge.synthTransferReceived({
          blockTag: blockNumber,
        })
        const synthTransferSent = await synthetixBridge.synthTransferSent({ blockTag: blockNumber })
        const issuedSynths = debtIssued.add(synthTransferSent.sub(synthTransferReceived))
        return [network, blockNumber, issuedSynths]
      } catch (e) {
        const error = e as any

        const errorPayload = {
          jobRunID,
          network,
          message: `Failed to fetch debt data from chain ${network}.  Error Message: ${e}`,
        }
        throw error.response
          ? new AdapterDataProviderError(errorPayload)
          : error.request
          ? new AdapterConnectionError(errorPayload)
          : new AdapterError(errorPayload)
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
