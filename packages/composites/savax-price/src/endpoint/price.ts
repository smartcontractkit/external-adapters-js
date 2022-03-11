import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config, FLOATING_POINT_DECIMALS } from '../config'
import * as TA from '@chainlink/token-allocation-adapter'
import { ethers } from 'ethers'
import { AdapterError } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['price']

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  const usdPerAvax = await getAvaxPrice(input, context)
  validateNonZeroValue(input.id, usdPerAvax, 'Avax Price')
  const avaxPooledShares = await getPooledAvaxShares(config)
  validateNonZeroValue(input.id, avaxPooledShares, 'Avax Pool Shares')
  const result = usdPerAvax
    .mul(avaxPooledShares)
    .div(ethers.BigNumber.from(10).pow(FLOATING_POINT_DECIMALS))
    .toString()
  return {
    jobRunID: input.id,
    statusCode: 200,
    result,
    data: {
      result,
    },
  }
}

export const validateNonZeroValue = (
  jobRunID: string,
  value: ethers.BigNumber,
  label: string,
): void => {
  console.log(value.toString())
  if (value.eq(ethers.BigNumber.from(0)))
    throw new AdapterError({
      jobRunID,
      statusCode: 500,
      message: `${label} shold not be 0`,
    })
}

export const getAvaxPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
): Promise<ethers.BigNumber> => {
  const _config = TA.makeConfig()
  const _execute = TA.makeExecute(_config)
  const allocations = [
    {
      symbol: 'AVAX',
      balance: ethers.BigNumber.from(10).pow(FLOATING_POINT_DECIMALS).toString(),
      decimals: FLOATING_POINT_DECIMALS,
    },
  ]
  const resp = await _execute({ id: input.id, data: { ...input.data, allocations } }, context)
  return ethers.utils.parseUnits(resp.data.result.toString(), FLOATING_POINT_DECIMALS)
}

export const sAvaxABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'shareAmount', type: 'uint256' }],
    name: 'getPooledAvaxByShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const getPooledAvaxShares = async (config: Config): Promise<ethers.BigNumber> => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const sAvaxContract = new ethers.Contract(config.sAvaxAddress, sAvaxABI, provider)
  return sAvaxContract.getPooledAvaxByShares(ethers.BigNumber.from(10).pow(FLOATING_POINT_DECIMALS))
}
