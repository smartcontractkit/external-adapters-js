import { AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { synthetix } from '@synthetixio/contracts-interface'
import { getDataFromAcrossChains } from '../commons'
import { Config } from '../config'

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
      const rpcUrl = config.chains[network]
      if (!rpcUrl) {
        throw new AdapterError({
          jobRunID,
          message: `RPC URL not set for chain: ${network}`,
        })
      }
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      const snxjs = synthetix({ provider })
      try {
        const [debtIssued] = await snxjs.contracts.DebtCache.currentDebt()
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
