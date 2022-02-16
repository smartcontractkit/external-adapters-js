import { AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { ethers, BigNumber } from 'ethers'
import { synthetix } from '@synthetixio/contracts-interface'
import { getDataFromAcrossChains, SupportedSynthetixNetwork } from '../commons'

export const supportedEndpoints = ['debt-ratio']

interface CurrentDebtResults {
  totalDebtIssued: ethers.BigNumber
  totalDebtShares: ethers.BigNumber
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getDebtRatio)

const getDebtRatio = async (
  jobRunID: string,
  chainsToQuery: SupportedSynthetixNetwork[],
): Promise<BigNumber> => {
  const chainResponses = await Promise.all(
    chainsToQuery.map(async (network: SupportedSynthetixNetwork): Promise<CurrentDebtResults> => {
      const snxjs = synthetix({ network })
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
          message: `Failed to fetch debt data from chain ${network}`,
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
