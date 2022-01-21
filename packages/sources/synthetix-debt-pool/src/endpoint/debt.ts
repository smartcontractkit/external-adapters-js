import { Requester, Validator, Logger, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, SUPPORTED_CHAINS } from '../config'
import { ethers, utils, BigNumber } from 'ethers'
import { isZeroAddress } from '@chainlink/ea-reference-data-reader'

export const supportedEndpoints = ['debt']

export const endpointResultPaths = {
  debt: 'debt',
}

interface CurrentDebtResults {
  totalSnxBackedDebt: ethers.BigNumber
  totalDebtShares: ethers.BigNumber
}

export interface ResponseSchema {
  data: {
    result: string
  }
}

export const inputParameters: InputParameters = {
  chainSources: {
    required: false,
    description: `Array of chains to pull debt from. Options for array elements are 'ethereum', 'optimism'`,
    type: 'array',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  let { chainSources } = validator.validated.data

  if (!chainSources || chainSources.length === 0) {
    Logger.info(
      'chainSources is either empty or undefined.  Will aggregate debt over all supported chains',
    )
    chainSources = Object.values(SUPPORTED_CHAINS)
  }

  const debt = await getCurrentDebt(jobRunID, chainSources, config.chains)
  const result = {
    data: {
      result: debt,
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}

const DEBT_POOL_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentDebt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'debt',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'anyRateIsInvalid',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalNonSnxBackedDebt',
    outputs: [
      { internalType: 'uint256', name: 'excludedDebt', type: 'uint256' },
      { internalType: 'bool', name: 'isInvalid', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const SYNTHETIX_DEBT_SHARE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const ADDRESS_PROVIDER_ABI = [
  {
    constant: true,
    inputs: [{ internalType: 'bytes32', name: 'name', type: 'bytes32' }],
    name: 'getAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const getCurrentDebt = async (
  jobRunID: string,
  chainSources: string[],
  chainConfigs: Config['chains'],
): Promise<string> => {
  const chainResponses = await Promise.all(
    chainSources.map(async (chain): Promise<CurrentDebtResults> => {
      chain = chain.toUpperCase()
      const chainConfig = chainConfigs[chain]
      if (!chainConfig) throw Error(`Missing configuration for chain: ${chain}`)

      const { rpcUrl, addressProviderContractAddress } = chainConfig
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      const addressProvider = new ethers.Contract(
        addressProviderContractAddress,
        ADDRESS_PROVIDER_ABI,
        provider,
      )
      const debtCacheAddress = await addressProvider.getAddress(
        utils.formatBytes32String('DebtCache'),
      )
      if (isZeroAddress(debtCacheAddress)) {
        throw new AdapterError({
          jobRunID,
          message: `Found zero address for DebtCache contract on chain ${chain}`,
        })
      }
      const debtCache = new ethers.Contract(debtCacheAddress, DEBT_POOL_ABI, provider)

      const synthetixDebtShareAddress = await addressProvider.getAddress(
        utils.formatBytes32String('SynthetixDebtShare'),
      )
      if (isZeroAddress(synthetixDebtShareAddress)) {
        throw new AdapterError({
          jobRunID,
          message: `Found zero address for SynthetixDebtShare contract on chain ${chain}`,
        })
      }
      const synthetixDebtShare = new ethers.Contract(
        synthetixDebtShareAddress,
        SYNTHETIX_DEBT_SHARE_ABI,
        provider,
      )

      const [chainTotalDebt] = await debtCache.currentDebt()
      const [chainTotalDebtNonSnxBackedDebt] = await debtCache.totalNonSnxBackedDebt()
      const chainTotalDebtShare = await synthetixDebtShare.totalSupply()
      return {
        totalDebtShares: chainTotalDebt.sub(chainTotalDebtNonSnxBackedDebt),
        totalSnxBackedDebt: chainTotalDebtShare,
      }
    }),
  )

  let totalSnxBackedDebt = BigNumber.from(0)
  let totalDebtShares = BigNumber.from(0)

  for (const chain of chainResponses) {
    totalSnxBackedDebt = totalSnxBackedDebt.add(chain.totalSnxBackedDebt)
    totalDebtShares = totalDebtShares.add(chain.totalDebtShares)
  }

  const totalSnxBackedDebtPart = totalSnxBackedDebt.toHexString().slice(2).padStart(32, '0')
  const totalDebtSharesPart = totalDebtShares.toHexString().slice(2).padStart(32, '0')
  return '0x' + totalSnxBackedDebtPart + totalDebtSharesPart
}
