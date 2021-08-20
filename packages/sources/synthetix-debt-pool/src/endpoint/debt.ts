import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import { ethers } from 'ethers'

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const debt = await getCurrentDebt(config.rpcUrl, config.debtPoolCacheAddress)
  const result = {
    data: {
      result: debt.total.toString(),
      total: debt.total.toString(),
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

const getCurrentDebt = async (
  rpcUrl: string,
  debtPoolAddress: string,
): Promise<CurrentDebtResults> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const debtPool = new ethers.Contract(debtPoolAddress, DEBT_POOL_ABI, provider)
  const [totalDebt, isInvalid] = await debtPool.currentDebt()
  return {
    total: totalDebt,
    isInvalid,
  }
}
