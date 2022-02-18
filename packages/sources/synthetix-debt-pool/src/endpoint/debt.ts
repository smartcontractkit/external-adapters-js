import { AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { BigNumber } from 'ethers'
import {
  getChainSynthetixInstance,
  getDataFromAcrossChains,
  inputParameters as commonInputParameters,
} from '../commons'
import { Config } from '../config'

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
      const snxjs = getChainSynthetixInstance(network, jobRunID, config)
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
