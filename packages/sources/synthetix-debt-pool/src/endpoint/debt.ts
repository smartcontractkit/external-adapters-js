import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, SUPPORTED_CHAINS } from '../config'
import { ethers, utils, BigNumber } from 'ethers'

export const supportedEndpoints = ['debt']

export const endpointResultPaths = {
  debt: 'debt',
}

interface CurrentDebtResults {
  total: ethers.BigNumber
  isInvalid: boolean
}

export interface ResponseSchema {
  data: {
    total: string
    isInvalid: boolean
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

  const debt = await getCurrentDebt(chainSources, config.chains)
  const result = {
    data: {
      result: debt.total.toString(),
      isInvalid: debt.isInvalid,
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
  chainSources: string[],
  chainConfigs: Config['chains'],
): Promise<CurrentDebtResults> => {
  const responses = await Promise.all(
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
      const debtPoolAddress = await addressProvider.getAddress(
        utils.formatBytes32String('DebtCache'),
      )
      const debtPool = new ethers.Contract(debtPoolAddress, DEBT_POOL_ABI, provider)
      const [totalDebt, isInvalid] = await debtPool.currentDebt()
      return {
        total: totalDebt,
        isInvalid,
      }
    }),
  )

  let totalDebt = BigNumber.from(0)
  let isInvalid = false

  for (const response of responses) {
    totalDebt = totalDebt.add(response.total)
    isInvalid = isInvalid || isInvalid
  }

  return {
    total: totalDebt,
    isInvalid,
  }
}
