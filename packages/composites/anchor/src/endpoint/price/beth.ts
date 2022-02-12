import { ethers } from 'ethers'
import { PriceExecute } from '.'
import BigNumber from 'bignumber.js'

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

export const execute: PriceExecute = async (input, _, config, taAdapterResponse) => {
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const anchorVaultContract = new ethers.Contract(
    config.anchorVaultContractAddress,
    anchorVaultAbi,
    provider,
  )
  const bEthExchangeRateBigNum = await anchorVaultContract.get_rate()

  // Need to convert to BigNumber JS from ethers BigNumber as the latter will remove all decimals
  const stEthPerBEth = new BigNumber(bEthExchangeRateBigNum.toString())
    .dividedBy(new BigNumber(10).pow(18))
    .toNumber()
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
