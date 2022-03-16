import { AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { getDataFromAcrossChains, inputParameters as commonInputParameters } from '../utils'
import { Config } from '../config'
import { getContractAddress } from '../utils'
import { DEBT_CACHE_ABI } from './abi'

// Needs to be exported so that doc generator script works
export const inputParameters = commonInputParameters
export const supportedEndpoints = ['debt']

export const execute: ExecuteWithConfig<Config> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getTotalDebtIssued)

const getTotalDebtIssued = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: string[],
): Promise<BigNumber> => {
  const chainResponses = await Promise.all(
    chainsToQuery.map(async (network): Promise<BigNumber> => {
      if (!config.chains[network])
        throw new AdapterError({
          jobRunID,
          statusCode: 500,
          message: `Chain ${network} not configured`,
        })
      const networkProvider = new ethers.providers.JsonRpcProvider(config.chains[network].rpcURL)
      try {
        const debtCacheAddress = await getContractAddress(
          networkProvider,
          config.chains[network].chainAddressResolverAddress,
          'DebtCache',
        )
        const debtCache = new ethers.Contract(debtCacheAddress, DEBT_CACHE_ABI, networkProvider)
        const [debtIssued] = await debtCache.currentDebt()
        return debtIssued
      } catch (e) {
        throw new AdapterError({
          jobRunID,
          message: `Failed to fetch debt data from chain ${network}.  Error Message: ${e}`,
        })
      }
    }),
  )

  let totalDebtIssued = BigNumber.from(0)
  for (const chainSynthesizedDebt of chainResponses) {
    totalDebtIssued = totalDebtIssued.add(chainSynthesizedDebt)
  }
  return totalDebtIssued
}
