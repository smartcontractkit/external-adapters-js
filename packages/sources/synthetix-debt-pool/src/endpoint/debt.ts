import { AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import { synthetix } from '@synthetixio/contracts-interface'
import { getDataFromAcrossChains, SupportedSynthetixNetwork } from '../commons'

export const supportedEndpoints = ['debt']

export const execute: ExecuteWithConfig<Config> = async (request, _, config) =>
  await getDataFromAcrossChains(request, config, getTotalDebtIssued)

const getTotalDebtIssued = async (
  jobRunID: string,
  chainsToQuery: SupportedSynthetixNetwork[],
): Promise<BigNumber> => {
  const chainResponses = await Promise.all(
    chainsToQuery.map(async (network: SupportedSynthetixNetwork): Promise<BigNumber> => {
      const snxjs = synthetix({ network })
      try {
        return await snxjs.contracts.DebtCache.currentDebt()
      } catch (e) {
        throw new AdapterError({
          jobRunID,
          message: `Failed to fetch debt data from chain ${network}`,
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
