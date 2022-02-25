import { AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import {
  getChainSynthetixInstance,
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
} from '../commons'
import { Config } from '../config'

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
      const snxjs = getChainSynthetixInstance(network, jobRunID, config)
      try {
        const [chainTotalDebt] = await snxjs.contracts.DebtCache.currentDebt()
        const chainTotalDebtShare = await snxjs.contracts.SynthetixDebtShare.totalSupply()
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
