import { AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import {
  getContractAddress,
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
} from '../utils'
import { Config } from '../config'
import { DEBT_CACHE_ABI, SYNTHETIX_DEBT_SHARE_ABI } from './abi'

// Needs to be exported so that doc generator script works
export const inputParameters = commonInputParameters
export const supportedEndpoints = ['debt-ratio']

interface CurrentDebtResults {
  totalDebtIssued: ethers.BigNumber
  totalDebtShares: ethers.BigNumber
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getDebtRatio)

const getDebtRatio = async (
  jobRunID: string,
  config: Config,
  chainsToQuery: string[],
): Promise<BigNumber> => {
  const chainResponses = await Promise.all(
    chainsToQuery.map(async (network): Promise<CurrentDebtResults> => {
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
        const [chainTotalDebt] = await debtCache.currentDebt()
        const synthetixDebtShareAddress = await getContractAddress(
          networkProvider,
          config.chains[network].chainAddressResolverAddress,
          'SynthetixDebtShare',
        )
        const synthetixDebtShare = new ethers.Contract(
          synthetixDebtShareAddress,
          SYNTHETIX_DEBT_SHARE_ABI,
          networkProvider,
        )
        const chainTotalDebtShare = await synthetixDebtShare.totalSupply()
        return {
          totalDebtIssued: chainTotalDebt,
          totalDebtShares: chainTotalDebtShare,
        }
      } catch (e) {
        throw new AdapterError({
          jobRunID,
          message: `Failed to fetch debt ratio from chain ${network}. Error Message: ${e.message}`,
        })
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
