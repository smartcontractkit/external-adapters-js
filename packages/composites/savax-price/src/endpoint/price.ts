import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/ea-bootstrap'
import { Config, FLOATING_POINT_DECIMALS } from '../config'
import * as TA from '@chainlink/token-allocation-adapter'
import { ethers } from 'ethers'
import {
  AdapterDataProviderError,
  AdapterResponseInvalidError,
  util,
} from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['price']

export type TInputParameters = TA.types.TInputParameters

export const execute = async (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
): Promise<AdapterResponse> => {
  let usdPerAvax
  try {
    usdPerAvax = await getAvaxPrice(input, context)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'avalanche',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
  validateNonZeroValue(input.id, usdPerAvax, 'Avax Price')
  let avaxPooledShares
  try {
    avaxPooledShares = await getPooledAvaxShares(config)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'avalanche',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

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
      statusCode: 200,
    },
  }
}

export const validateNonZeroValue = (
  jobRunID: string,
  value: ethers.BigNumber,
  label: string,
): void => {
  if (value.eq(ethers.BigNumber.from(0)))
    throw new AdapterResponseInvalidError({
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
  // TODO: makeExecute return types
  return ethers.utils.parseUnits((resp.data.result as any).toString(), FLOATING_POINT_DECIMALS)
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
