import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import * as TA from '@chainlink/token-allocation-adapter'
import { BigNumber, ethers } from 'ethers'
import { FIXED_POINT_DECIMALS } from './config'

export const getTokenPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
  symbol: string,
  decimals = 18,
): Promise<AdapterResponse> => {
  const _config = TA.makeConfig()
  const _execute = TA.makeExecute(_config)
  const allocations = [
    {
      symbol,
      balance: BigNumber.from(10).pow(decimals).toString(),
      decimals,
    },
  ]
  return await _execute({ id: input.id, data: { ...input.data, allocations } }, context)
}

export const convertUSDQuote = async (
  input: AdapterRequest,
  context: AdapterContext,
  usdPrice: ethers.BigNumber,
  targetQuote: string,
  targetQuoteDecimals = 18,
): Promise<ethers.BigNumber> => {
  const targetQuoteUSDRateResp = await getTokenPrice(
    input,
    context,
    targetQuote,
    targetQuoteDecimals,
  )
  const targetQuoteUSDRate = ethers.utils.parseUnits(
    targetQuoteUSDRateResp.data.result.toString(),
    FIXED_POINT_DECIMALS,
  )
  return usdPrice.mul(BigNumber.from(10).pow(FIXED_POINT_DECIMALS)).div(targetQuoteUSDRate)
}
