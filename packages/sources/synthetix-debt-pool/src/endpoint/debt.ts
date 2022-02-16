import { Requester, Validator, Logger, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, SUPPORTED_CHAINS } from '../config'
import { ethers, BigNumber } from 'ethers'
import { synthetix } from '@synthetixio/contracts-interface'

export const supportedEndpoints = ['debt']

export const endpointResultPaths = {
  debt: 'debt',
}

interface CurrentDebtResults {
  totalDebtIssued: ethers.BigNumber
  totalDebtShares: ethers.BigNumber
}

type SupportedSynthetixNetwork =
  | 'mainnet'
  | 'goerli'
  | 'mainnet-ovm'
  | 'kovan'
  | 'kovan-ovm'
  | 'mainnet-fork'
  | undefined

export const inputParameters: InputParameters = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are "mainnet" | "goerli" | "mainnet-ovm" | "kovan" | "kovan-ovm" | "mainnet-fork"`,
    type: 'array',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  let { chainSources } = validator.validated.data

  if (!chainSources || chainSources.length === 0) {
    Logger.info(
      'chainSources is either empty or undefined.  Will aggregate debt over all supported chains',
    )
    chainSources = Object.values(SUPPORTED_CHAINS)
  }

  const debt = await getCurrentDebt(jobRunID, chainSources)
  const result = {
    data: {
      result: debt.toString(),
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}

const getCurrentDebt = async (
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
