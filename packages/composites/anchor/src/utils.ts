import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import * as TA from '@chainlink/token-allocation-adapter'
import { BigNumber } from 'ethers'
import { DEFAULT_TOKEN_DECIMALS } from './config'

export const getTokenPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
  symbol: string,
  decimals = DEFAULT_TOKEN_DECIMALS,
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
  usdPrice: number,
  targetQuote: string,
  targetQuoteDecimals = DEFAULT_TOKEN_DECIMALS,
): Promise<number> => {
  const targetQuoteUSDRateResp = await getTokenPrice(
    input,
    context,
    targetQuote,
    targetQuoteDecimals,
  )
  const targetQuoteUSDRate = targetQuoteUSDRateResp.data.result
  return usdPrice / targetQuoteUSDRate
}
