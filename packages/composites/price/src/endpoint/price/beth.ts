import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { Config } from '../../config'

export const FROM = 'BETH'
export const INTERMEDIARY_TOKEN_DECIMALS = 8
export const INTERMEDIARY_TOKEN = 'stETH'

export const anchorVaultAbi = [
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_rate',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

export const execute = async (
  input: AdapterRequest,
  _: AdapterContext,
  config: Config,
  taAdapterResponse: AdapterResponse,
): Promise<AdapterResponse> => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const anchorVaultContract = new ethers.Contract(
    config.anchorVaultContractAddress,
    anchorVaultAbi,
    provider,
  )
  const bEthExchangeRateBigNum = await anchorVaultContract.get_rate()
  const stEthPerBEth = bEthExchangeRateBigNum.div(BigNumber.from(10).pow(18)).toNumber()
  const usdPerStEth = taAdapterResponse.data.result
  const result = usdPerStEth * stEthPerBEth
  return {
    jobRunID: input.id,
    statusCode: 200,
    result,
    data: {
      result,
    },
  }
}
